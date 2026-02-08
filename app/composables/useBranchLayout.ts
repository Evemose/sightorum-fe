/**
 * Represents a branch's position in the grid layout
 * row: grid row (main branch is in the middle, forks above/below)
 * startColumn: grid column where this branch starts (1-based for CSS Grid)
 */
export interface BranchPosition {
    branchId: string
    row: number // CSS Grid row (1-based, will be normalized)
    startColumn: number // CSS Grid column where branch starts (1-based)
    parentBranchId: string | null
}

export interface LayoutConfig {
    maxSearchDistance: number // N - how far to search initially
}

export interface BranchInput {
    branchId: string
    parentBranchId: string | null
    startNodeIndex: number // Which node index to start from (0-based)
}

/**
 * Grid layout output - use this to configure your CSS Grid container
 */
export interface GridLayout {
    /** Total number of rows needed */
    totalRows: number
    /** Row number where main branch is (1-based) */
    mainBranchRow: number
    /** All branch positions */
    branches: readonly BranchPosition[]
}

interface LayoutState {
    positions: Map<string, BranchPosition>
    occupiedRows: Set<number> // Using "row" terminology internally too
    branchHierarchy: Map<string, string[]> // parentId -> childIds
    logicalYs: Map<string, number> // branchId -> logical Y (0 = main, + = up, - = down)
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
 *    - If parent Y >= 0 (at or above main) → prefer going UP
 *    - If parent Y < 0 (below main) → prefer going DOWN
 * 3. Forks try to find position N slots away in preferred direction
 * 4. If not available, try inverse direction
 * 5. If both fail, decrease N and retry
 * 6. If no slot found, try swapping with siblings
 * 7. Recursively try parent swaps if needed
 * 8. As last resort, move first-level fork to end and expand
 */
export function useBranchLayout(config: Ref<LayoutConfig> | LayoutConfig = {maxSearchDistance: 2}) {
    const resolvedConfig = isRef(config) ? config : ref(config)

    // Reactive state
    const state = ref<LayoutState>({
        positions: new Map(),
        occupiedRows: new Set(),
        branchHierarchy: new Map(),
        logicalYs: new Map()
    })

    // Computed: get grid layout with normalized rows (1-based for CSS Grid)
    const gridLayout = computed<GridLayout>(() => {
        const logicalYValues = Array.from(state.value.logicalYs.values())

        if (logicalYValues.length === 0) {
            return {totalRows: 1, mainBranchRow: 1, branches: []}
        }

        const minY = Math.min(...logicalYValues)
        const maxY = Math.max(...logicalYValues)
        const totalRows = maxY - minY + 1

        // Convert logical Y to CSS Grid row (1-based)
        // Logical Y is: 0 = main, positive = above, negative = below
        // CSS Grid row: higher Y should have lower row number (top of grid)
        const logicalYToRow = (y: number): number => {
            return maxY - y + 1
        }

        const branches: BranchPosition[] = Array.from(state.value.positions.values()).map(pos => ({
            branchId: pos.branchId,
            row: logicalYToRow(state.value.logicalYs.get(pos.branchId) ?? 0),
            startColumn: pos.startColumn,
            parentBranchId: pos.parentBranchId
        }))

        return {
            totalRows,
            mainBranchRow: logicalYToRow(0),
            branches: Object.freeze(branches)
        }
    })

    // Get position for a specific branch
    function getPosition(branchId: string): BranchPosition | undefined {
        const layout = gridLayout.value
        return layout.branches.find(b => b.branchId === branchId)
    }

    // Check if a logical Y position is available
    function isYAvailable(y: number): boolean {
        return !state.value.occupiedRows.has(y)
    }

    // Reserve a logical Y position
    function reserveY(y: number): void {
        state.value.occupiedRows.add(y)
    }

    // Release a logical Y position
    function releaseY(y: number): void {
        state.value.occupiedRows.delete(y)
    }

    // Get siblings of a branch (other children of same parent)
    function getSiblings(branchId: string): string[] {
        const pos = state.value.positions.get(branchId)
        if (!pos?.parentBranchId) return []

        const siblings = state.value.branchHierarchy.get(pos.parentBranchId) || []
        return siblings.filter(id => id !== branchId)
    }

    /**
     * Try to find an available Y position
     */
    function findAvailableY(
        startingY: number,
        n: number,
        preferUp: boolean
    ): number | null {
        const primaryDirection = preferUp ? 1 : -1
        const secondaryDirection = -primaryDirection

        for (let i = n; i >= 1; i--) {
            const y = startingY + (i * primaryDirection)
            if (isYAvailable(y)) return y
        }

        for (let i = n; i >= 1; i--) {
            const y = startingY + (i * secondaryDirection)
            if (isYAvailable(y)) return y
        }

        return null
    }

    /**
     * Try to swap positions with a sibling
     */
    function trySwapWithSibling(
        branchId: string,
        targetY: number,
        preferUp: boolean
    ): boolean {
        const siblings = getSiblings(branchId)
        const direction = preferUp ? 1 : -1

        const sortedSiblings = siblings
            .map(id => ({id, y: state.value.logicalYs.get(id) ?? 0}))
            .sort((a, b) => (b.y - a.y) * direction)

        for (const sibling of sortedSiblings) {
            const siblingY = sibling.y

            if ((preferUp && siblingY > targetY) || (!preferUp && siblingY < targetY)) {
                const currentY = state.value.logicalYs.get(branchId)
                if (currentY === undefined) continue

                // Perform swap
                releaseY(siblingY)
                releaseY(currentY)

                state.value.logicalYs.set(branchId, siblingY)
                state.value.logicalYs.set(sibling.id, currentY)

                reserveY(siblingY)
                reserveY(currentY)

                return true
            }
        }

        return false
    }

    /**
     * Recursively try to reposition parent branches
     */
    function tryRepositionParent(
        branchId: string,
        preferUp: boolean,
        depth: number = 0
    ): boolean {
        if (depth > 10) return false

        const pos = state.value.positions.get(branchId)
        if (!pos?.parentBranchId) return false

        const parentId = pos.parentBranchId
        const parentY = state.value.logicalYs.get(parentId)
        if (parentY === undefined) return false

        if (trySwapWithSibling(parentId, parentY, preferUp)) return true
        if (trySwapWithSibling(parentId, parentY, !preferUp)) return true

        return tryRepositionParent(parentId, preferUp, depth + 1)
    }

    /**
     * Get the first-level fork ancestor of a branch
     */
    function getFirstLevelForkAncestor(branchId: string): string | null {
        let currentId = branchId
        let lastForkId: string | null = null

        while (currentId) {
            const pos = state.value.positions.get(currentId)
            if (!pos) break

            if (pos.parentBranchId === null) return lastForkId

            const parentPos = state.value.positions.get(pos.parentBranchId)
            if (parentPos?.parentBranchId === null) return currentId

            lastForkId = currentId
            currentId = pos.parentBranchId
        }

        return lastForkId
    }

    /**
     * Move a first-level fork to the end
     */
    function moveToEnd(branchId: string, preferUp: boolean): number {
        const allYs = Array.from(state.value.occupiedRows)
        const currentY = state.value.logicalYs.get(branchId)

        if (currentY === undefined) return 0

        releaseY(currentY)

        let newY: number
        if (preferUp) {
            newY = allYs.length > 0 ? Math.max(...allYs) + 1 : 1
        } else {
            newY = allYs.length > 0 ? Math.min(...allYs) - 1 : -1
        }

        state.value.logicalYs.set(branchId, newY)
        reserveY(newY)

        return newY
    }

    /**
     * Calculate position for a branch
     */
    function calculatePosition(input: BranchInput): void {
        const {branchId, parentBranchId, startNodeIndex} = input
        const {maxSearchDistance} = resolvedConfig.value

        // Main branch is always at Y=0, column 1
        if (parentBranchId === null) {
            state.value.positions.set(branchId, {
                branchId,
                row: 0, // Will be normalized later
                startColumn: 1,
                parentBranchId: null
            })
            state.value.logicalYs.set(branchId, 0)
            reserveY(0)
            return
        }

        // Get parent's Y as starting point
        const parentY = state.value.logicalYs.get(parentBranchId) ?? 0

        // Preferred direction based on starting Y (parent's Y):
        // If parent Y < 0 (below main) → prefer going further down
        // If parent Y >= 0 (at or above main) → prefer going up
        const preferUp = parentY >= 0

        // Register in hierarchy
        const children = state.value.branchHierarchy.get(parentBranchId) || []
        children.push(branchId)
        state.value.branchHierarchy.set(parentBranchId, children)

        // Column starts after fork point (1-based for CSS Grid)
        const startColumn = startNodeIndex + 2 // +1 for 0-index, +1 for CSS Grid 1-based

        // Try to find available Y
        let assignedY = findAvailableY(parentY, maxSearchDistance, preferUp)

        // Try swapping with siblings
        if (assignedY === null) {
            const tempY = parentY + (preferUp ? 1 : -1)
            state.value.logicalYs.set(branchId, tempY)
            state.value.positions.set(branchId, {
                branchId,
                row: 0,
                startColumn,
                parentBranchId
            })

            if (trySwapWithSibling(branchId, tempY, preferUp)) {
                assignedY = state.value.logicalYs.get(branchId)!
            } else if (trySwapWithSibling(branchId, tempY, !preferUp)) {
                assignedY = state.value.logicalYs.get(branchId)!
            }

            if (assignedY === null) {
                state.value.positions.delete(branchId)
                state.value.logicalYs.delete(branchId)
            }
        }

        // Try repositioning parents
        if (assignedY === null) {
            const tempY = parentY + (preferUp ? 1 : -1)
            state.value.logicalYs.set(branchId, tempY)
            state.value.positions.set(branchId, {
                branchId,
                row: 0,
                startColumn,
                parentBranchId
            })

            if (tryRepositionParent(branchId, preferUp)) {
                assignedY = findAvailableY(parentY, maxSearchDistance, preferUp)
            }

            if (assignedY === null) {
                state.value.positions.delete(branchId)
                state.value.logicalYs.delete(branchId)
            }
        }

        // Last resort - move first-level fork to end
        if (assignedY === null) {
            const firstLevelAncestor = getFirstLevelForkAncestor(branchId)

            if (firstLevelAncestor && firstLevelAncestor !== branchId) {
                moveToEnd(firstLevelAncestor, preferUp)
                assignedY = findAvailableY(parentY, maxSearchDistance, preferUp)
            }

            if (assignedY === null) {
                const allYs = Array.from(state.value.occupiedRows)
                assignedY = preferUp
                    ? (allYs.length > 0 ? Math.max(...allYs) + 1 : 1)
                    : (allYs.length > 0 ? Math.min(...allYs) - 1 : -1)
            }
        }

        state.value.positions.set(branchId, {
            branchId,
            row: 0, // Will be normalized by gridLayout computed
            startColumn,
            parentBranchId
        })
        state.value.logicalYs.set(branchId, assignedY)
        reserveY(assignedY)
    }

    /**
     * Add a branch to the layout
     */
    function addBranch(input: BranchInput): void {
        if (state.value.positions.has(input.branchId)) {
            removeBranch(input.branchId)
        }
        calculatePosition(input)
    }

    /**
     * Remove a branch from the layout
     */
    function removeBranch(branchId: string): void {
        const y = state.value.logicalYs.get(branchId)
        if (y !== undefined) {
            releaseY(y)
        }

        state.value.positions.delete(branchId)
        state.value.logicalYs.delete(branchId)

        // Remove from parent's children list
        const pos = state.value.positions.get(branchId)
        if (pos?.parentBranchId) {
            const siblings = state.value.branchHierarchy.get(pos.parentBranchId)
            if (siblings) {
                const index = siblings.indexOf(branchId)
                if (index > -1) siblings.splice(index, 1)
            }
        }

        state.value.branchHierarchy.delete(branchId)
    }

    /**
     * Build layout from a flat list of branch inputs
     * Branches should be ordered: main branch first, then children in order
     */
    function buildLayout(inputs: BranchInput[]): GridLayout {
        reset()
        for (const input of inputs) {
            calculatePosition(input)
        }
        return gridLayout.value
    }

    /**
     * Reset all state
     */
    function reset(): void {
        state.value.positions.clear()
        state.value.occupiedRows.clear()
        state.value.branchHierarchy.clear()
        state.value.logicalYs.clear()
    }

    return {
        // Readonly output - use this for rendering
        gridLayout,

        // Getters
        getPosition,

        // Actions (inputs)
        addBranch,
        removeBranch,
        buildLayout,

        // Utilities
        reset
    }
}
