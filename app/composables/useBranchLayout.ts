import {computed, type ComputedRef, type Ref, ref} from 'vue'

export type Branch = {
    id: string
    length: number
    parent?: Branch,
    forkPointIdx?: number
}

export type BranchPosition = {
    row: number
    startColumn: number,
    length: number,
    getGridArea: () => string
};

type GridSize = {
    rows: number
    columns: number
}

export type Layout = {
    grid: GridSize,
    branches: {
        [branchId: string]: BranchPosition
    }
}

export type LayoutConfig = {
    maxSearchDistance: number
}

export type BranchInput<PID extends string | undefined = string | undefined> = {
    id: string
    length: number
    parentId?: PID,
    forkPointIdx?: PID extends string ? number : never
}

export type BranchLayoutReturn = {
    /** Reactive layout result with grid dimensions and branch positions */
    layout: ComputedRef<Layout>
    /** Current branch definitions (read-only view) */
    branches: ComputedRef<ReadonlyArray<Branch>>
    /** Add a branch. parentId must reference an existing branch (or omit for root). */
    addBranch: <PID extends string | undefined,>(input: BranchInput<PID>) => void
    /** Remove a branch and all its descendants by id. Cannot remove root. */
    removeBranch: (branchId: string) => void
    /** Replace all branches at once */
    setBranches: <PID extends string | undefined,>(inputs: BranchInput<PID>[]) => void
    /** Get the position of a specific branch, or undefined if not found */
    positionOf: (branchId: string) => BranchPosition | undefined
}

/**
 * Headless composable for calculating branch positions in a CSS Grid layout.
 *
 * This is a pure blackbox that:
 * - Takes branch inputs (id, parentId, startNodeIndex)
 * - Outputs grid placement data (row, startColumn)
 *
 * Use the output to set CSS Grid properties:
 * - grid-row: position.row
 * - grid-column-start: position.startColumn
 *
 * Algorithm:
 * 1. Main branch is always at logical Y=0 (centered row)
 * 2. Preferred direction is computed PER BRANCH based on parent's Y:
 *    - If parent Y > 0 (at or above main) → prefer going UP
 *    - If parent Y < 0 (below main) → prefer going DOWN
 *    - If parent Y = 0, round-robin based on number of existing root-parented branches in each direction
 * 3. Forks try to find position N slots away in preferred direction
 * 4. If not available, try inverse direction
 * 5. If both fail, decrease N and retry
 * 6. If no slot found, push entire subtree of closest ancestor in preferred direction, then start again from step 3
 */
export function useBranchLayout(
    config: LayoutConfig = {maxSearchDistance: 2},
    initialBranches?: BranchInput[]
): BranchLayoutReturn {

    // --- Reactive state ---

    const branchInputs: Ref<BranchInput[]> = ref(initialBranches ?? [])

    const resolvedBranches = computed<Branch[]>(() => {
        return resolveBranches(branchInputs.value)
    })

    const layout = computed<Layout>(() => {
        return calculateLayout(resolvedBranches.value)
    })

    const branches = computed<ReadonlyArray<Branch>>(() => resolvedBranches.value)

    // --- Public API ---

    function addBranch(input: BranchInput): void {
        branchInputs.value = [...branchInputs.value, input]
    }

    function removeBranch(branchId: string): void {
        const descendantIds = new Set<string>()

        function collectDescendants(id: string) {
            descendantIds.add(id)
            for (const b of branchInputs.value) {
                if (b.parentId === id) {
                    collectDescendants(b.id)
                }
            }
        }

        collectDescendants(branchId)
        branchInputs.value = branchInputs.value.filter(b => !descendantIds.has(b.id))
    }

    function setBranches(inputs: BranchInput[]): void {
        branchInputs.value = [...inputs]
    }

    function positionOf(branchId: string): BranchPosition | undefined {
        return layout.value.branches[branchId]
    }

    // --- Input resolution ---

    function resolveBranches(inputs: BranchInput[]): Branch[] {
        const branchMap = new Map<string, Branch>()
        // First pass: create all branches without parent references
        for (const input of inputs) {
            branchMap.set(input.id, {id: input.id, length: input.length, forkPointIdx: input.forkPointIdx})
        }
        // Second pass: wire up parent references
        for (const input of inputs) {
            if (input.parentId) {
                const branch = branchMap.get(input.id)!
                const parent = branchMap.get(input.parentId)
                if (!parent) {
                    throw new Error(`Parent branch ${input.parentId} not found for branch ${input.id}`)
                }
                branch.parent = parent
            }
        }
        return Array.from(branchMap.values())
    }

    // --- Layout engine internals ---

    function gridAreaFor(row: number, startColumn: number, length: number): () => string {
        return () => `${row} / ${startColumn} / ${row} / ${startColumn + length}`
    }

    type PosMap = Map<string, BranchPosition>

    function calculateLayout(branches: Branch[]): Layout {
        const nonParentBranches = branches.filter(b => !b.parent)
        if (nonParentBranches.length > 1) {
            throw new Error('Malformed DAG: More than 1 main branch (no parent) found')
        }
        if (nonParentBranches.length === 0) {
            return {grid: {rows: 0, columns: 0}, branches: {}}
        }
        const rootBranch = nonParentBranches[0]!
        const posMap: PosMap = new Map<string, BranchPosition>();
        posMap.set(
            rootBranch.id,
            {
                row: 0,
                startColumn: 1,
                length: rootBranch.length,
                getGridArea: gridAreaFor(1, 1, rootBranch.length)
            }
        )
        const alreadySet = new Set<string>([rootBranch.id])
        while (alreadySet.size < branches.length) {
            let progress = false
            let roundRobinCounter = 0;
            for (const branch of branches) {
                if (alreadySet.has(branch.id)) continue
                if (!branch.parent) {
                    throw new Error(`Malformed DAG: Multiple main branches found (branch ${branch.id} has no parent but is not the root)`)
                }
                if (!alreadySet.has(branch.parent.id)) continue

                const preferUp = branch.parent.id === rootBranch.id
                    ? roundRobinCounter++ % 2 === 0
                    : posMap.get(branch.parent.id)!.row >= posMap.get(rootBranch.id)!.row
                const pos = placeBranch({branch, preferUp, posMap, allBranches: branches}, false)
                posMap.set(branch.id, pos)
                alreadySet.add(branch.id)
                progress = true
            }
            if (!progress) {
                throw new Error('Malformed DAG: Could not place all branches, likely due to a cycle')
            }
        }

        const [grid, minRow] = buildGrid(posMap);
        const normalizedPositions: { [branchId: string]: BranchPosition } = {}
        for (const [branchId, pos] of posMap.entries()) {
            normalizedPositions[branchId] = {
                ...pos,
                row: pos.row - minRow + 1,
                getGridArea: gridAreaFor(pos.row - minRow + 1, pos.startColumn, pos.length)
            }
        }
        return {grid, branches: normalizedPositions}
    }

    function buildGrid(posMap: PosMap): [GridSize, number] {
        let minRow = Infinity
        let maxRow = -Infinity
        let maxColumn = -Infinity
        for (const pos of posMap.values()) {
            minRow = Math.min(minRow, pos.row)
            maxRow = Math.max(maxRow, pos.row)
            maxColumn = Math.max(maxColumn, pos.startColumn + pos.length - 1)
        }
        return [{
            rows: maxRow - minRow + 1,
            columns: maxColumn
        }, minRow]
    }

    type TryPlaceParams = {
        branch: Branch
        preferUp: boolean
        posMap: PosMap
        n?: number,
        allBranches: Branch[]
    }

    function childrenOf(branch: Branch, allBranches: Branch[], maxDepth: number = Infinity, depth: number = 0): Branch[] {
        if (depth >= maxDepth) return []
        return allBranches.filter(b => b.parent?.id === branch.id)
            .flatMap(b => [b, ...childrenOf(b, allBranches, maxDepth, depth + 1)])
    }

    function applyYDiff(
        allBranches: Branch[],
        snapshot: Map<string, BranchPosition>,
        parent: Branch,
        yDiff: number
    ) {
        const allChildren = childrenOf(parent, allBranches)
        for (const branch of [parent, ...allChildren]) {
            const pos = snapshot.get(branch.id)
            if (pos) {
                snapshot.set(branch.id, {
                    ...pos,
                    row: pos.row + yDiff,
                    getGridArea: gridAreaFor(pos.row + yDiff, pos.startColumn, pos.length)
                })
            }
        }
    }

    function layoutConflicts(snapshot: PosMap, branches: Branch[]) {
        const conflicts: [Branch, Branch][] = []
        const seen = new Set<string>()
        for (const branchA of branches) {
            const posA = snapshot.get(branchA.id)
            if (!posA) continue
            for (const branchB of branches.filter(b => b.id !== branchA.id && !seen.has(b.id))) {
                if (branchA.id === branchB.id) continue
                const posB = snapshot.get(branchB.id)
                if (!posB) continue
                if (doIntersect(posA, posB)) {
                    conflicts.push([branchA, branchB])
                }
            }
            seen.add(branchA.id)
        }
        return conflicts.sort(depthComparator())
    }

    function isChildOf(potentialChild: Branch, potentialParent: Branch): boolean {
        let current = potentialChild.parent
        while (current) {
            if (current.id === potentialParent.id) {
                return true
            }
            current = current.parent
        }
        return false
    }

    function depthComparator(): (a: [Branch, Branch], b: [Branch, Branch]) => number {
        const depthMap = new Map<string, number>()

        function getDepth(branch: Branch): number {
            if (depthMap.has(branch.id)) {
                return depthMap.get(branch.id)!
            }
            const depth = branch.parent ? 1 + getDepth(branch.parent) : 0
            depthMap.set(branch.id, depth)
            return depth
        }

        return (a: [Branch, Branch], b: [Branch, Branch]) => {
            const aMaxDepth = Math.max(getDepth(a[0]), getDepth(a[1]))
            const bMaxDepth = Math.max(getDepth(b[0]), getDepth(b[1]))
            return aMaxDepth - bMaxDepth
        }
    }

    function pushCascade(
        pushedBranch: Branch,
        posMap: PosMap,
        allBranches: Branch[],
        direction: 'up' | 'down',
        defaultMagnitude: number = 1
    ) {
        if (!pushedBranch.parent) {
            const childrenOnPreferredSide = childrenOf(pushedBranch, allBranches, 1).filter(child => {
                const pos = posMap.get(child.id)
                if (!pos) return false
                return direction === 'up' ? pos.row <= posMap.get(pushedBranch.id)!.row :
                    pos.row >= posMap.get(pushedBranch.id)!.row
            })
            for (const child of childrenOnPreferredSide) {
                pushCascade(child, posMap, allBranches, direction, defaultMagnitude)
            }
            return;
        }
        const curPos = posMap.get(pushedBranch.id)
        const parentPos = posMap.get(pushedBranch.parent!.id)
        if (!curPos || !parentPos) {
            throw new Error(`Positions not found for pushed branch ${pushedBranch.id} or its parent ${pushedBranch.parent!.id}`)
        }
        const magnitude = Math.sign(curPos.row) != Math.sign(parentPos.row) ?
            Math.abs(curPos.row) + 1 : defaultMagnitude
        const yDiff = (direction === 'up' ? -1 : 1) * magnitude
        if (curPos.row + yDiff === parentPos.row) {
            pushCascade(pushedBranch.parent!, posMap, allBranches, direction, magnitude)
        }
        applyYDiff(allBranches, posMap, pushedBranch, yDiff);
        let conflicts = layoutConflicts(posMap, allBranches)
        while (conflicts.length > 0) {
            for (const [bA, bB] of conflicts) {
                const bAPos = posMap.get(bA.id)
                const bBPos = posMap.get(bB.id)
                if (!bAPos || !bBPos) {
                    throw new Error(`Positions not found during push cascade conflict resolution for branches ${bA.id} and ${bB.id}`)
                }
                if (!doIntersect(bAPos, bBPos)) {
                    continue
                }
                if (isChildOf(bA, pushedBranch)) {
                    pushCascade(bB, posMap, allBranches, direction)
                } else {
                    pushCascade(bA, posMap, allBranches, direction)
                }
            }
            conflicts = layoutConflicts(posMap, allBranches)
        }
    }

    function pushThenPlace(
        params: TryPlaceParams
    ): BranchPosition {
        pushCascade(params.branch.parent!, params.posMap, params.allBranches, params.preferUp ? 'up' : 'down')
        return placeBranch({...params, preferUp: params.preferUp, n: config.maxSearchDistance}, false)
    }

    type PlaceBranchResult<INT extends boolean> = INT extends false ? BranchPosition : BranchPosition | null

    type MemoKey = string

    function getMemoKey(params: TryPlaceParams): MemoKey {
        return `${params.branch.id}-${params.preferUp}-${params.n ?? 'none'}`
    }

    function placeBranch<INT extends boolean>(
        params: TryPlaceParams,
        internal: INT,
        memo: Map<MemoKey, BranchPosition | null> = new Map()
    ): PlaceBranchResult<INT> {
        if (params.n !== undefined && params.n < 0) {
            if (!internal) {
                throw new Error("N must be >= 0 when placing branch " + params.branch.id)
            }
            return null as PlaceBranchResult<INT>
        }
        const {branch, preferUp, posMap, n = config.maxSearchDistance} = params;
        const parentPos = posMap.get(branch.parent!.id)
        if (!parentPos) {
            throw new Error(`Parent position not found for branch ${branch.id}`)
        }
        const key = getMemoKey(params)
        if (memo.has(key)) {
            return memo.get(key)!
        }
        const direction = preferUp ? -1 : 1
        const targetRow = parentPos.row + direction * n;
        const hypotheticalPos: BranchPosition = {
            row: targetRow,
            startColumn: parentPos.startColumn + (branch.forkPointIdx ?? 0) + 1,
            length: branch.length,
            getGridArea: gridAreaFor(targetRow, parentPos.startColumn + 1, branch.length)
        }

        for (const pos of posMap.values()) {
            if (doIntersect(hypotheticalPos, pos)) {
                const result = placeBranch({...params, n: n - 1}, true, memo) ??
                    placeBranch({...params, preferUp: !preferUp}, true, memo);
                if (result) {
                    memo.set(key, result)
                    return result
                } else {
                    if (!internal) {
                        memo.clear();
                        return pushThenPlace(params)
                    } else {
                        return null as PlaceBranchResult<INT>
                    }
                }
            }
        }

        memo.set(key, hypotheticalPos)
        return hypotheticalPos
    }

    function doIntersect(a: BranchPosition, b: BranchPosition): boolean {
        if (a.row !== b.row) {
            return false
        }
        const aStart = a.startColumn
        const aEnd = a.startColumn + a.length - 1
        const bStart = b.startColumn
        const bEnd = b.startColumn + b.length - 1
        return aStart <= bEnd && bStart <= aEnd
    }

    return {
        layout,
        branches,
        addBranch,
        removeBranch,
        setBranches,
        positionOf,
    }
}