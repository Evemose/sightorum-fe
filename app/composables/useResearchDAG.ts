import {computed, type Ref} from 'vue'
import {type BranchInput, type LayoutConfig, useBranchLayout} from './useBranchLayout'
import type {ResearchNode, ResearchResponse} from '~/types/schemas'
import type {ResearchTreeBranch, ResearchTreeNode} from '~/types/research-tree'

export type DependencyEdge = {
    fromNodeId: string
    toNodeId: string
}

export type ResearchDAGLayout = {
    layout: ReturnType<typeof useBranchLayout>['layout']
    spine: {
        branchId: string
        nodes: ResearchTreeNode[]
        analysisNode: ResearchTreeNode | null
    }
    researchBranches: ResearchTreeBranch[]
    /** All tree nodes by structural nodeId */
    nodeMap: Map<string, ResearchTreeNode>
    /** Cross-node dependency edges (from dependencyRefs on STEPs) */
    dependencyEdges: DependencyEdge[]
    branchInputs: BranchInput[]
}

const SPINE_BRANCH_ID = '__spine__'

export function useResearchDAG(
    research: Ref<ResearchResponse | null>,
    config: LayoutConfig = { maxSearchDistance: 2 }
) {
    const engine = useBranchLayout(config)

    return computed<ResearchDAGLayout | null>(() => {
        const r = research.value
        if (!r || r.nodes.length === 0) return null

        const nodeMap = new Map<string, ResearchTreeNode>()
        // Lookup: "branchId::stepId" → structuralNodeId
        const stepLookup = new Map<string, string>()
        const branchStepsMap = new Map<string, ResearchTreeNode[]>()
        const branchNodeMap = new Map<string, ResearchTreeNode>()
        let scoutNode: ResearchTreeNode | null = null
        let planNode: ResearchTreeNode | null = null
        let analysisNode: ResearchTreeNode | null = null

        // Phase 1: Classify all nodes
        for (const raw of r.nodes) {
            const treeNode = toTreeNode(raw)
            nodeMap.set(treeNode.id, treeNode)

            switch (raw.nodeType) {
                case 'SCOUT':
                    scoutNode = treeNode
                    break
                case 'PLAN':
                    planNode = treeNode
                    break
                case 'ANALYSIS':
                    analysisNode = treeNode
                    break
                case 'BRANCH': {
                    const info = raw.structural
                    if (info.type === 'BRANCH') {
                        branchNodeMap.set(info.branchId, treeNode)
                    }
                    break
                }
                case 'STEP': {
                    const info = raw.structural
                    if (info.type === 'STEP') {
                        stepLookup.set(`${info.branchId}::${info.stepId}`, treeNode.id)
                        if (!branchStepsMap.has(info.branchId)) {
                            branchStepsMap.set(info.branchId, [])
                        }
                        branchStepsMap.get(info.branchId)!.push(treeNode)
                    }
                    break
                }
            }
        }

        // Phase 2: Order steps within each branch
        const orderedBranches: ResearchTreeBranch[] = []
        for (const [branchId, steps] of branchStepsMap) {
            const ordered = orderSteps(steps, r.nodes)
            const branchNode = branchNodeMap.get(branchId)
            const allNodes = branchNode ? [branchNode, ...ordered] : ordered
            orderedBranches.push({
                branchId,
                label: branchId,
                status: deriveBranchStatus(allNodes),
                nodes: allNodes,
            })
        }
        for (const [branchId, branchNode] of branchNodeMap) {
            if (!branchStepsMap.has(branchId)) {
                orderedBranches.push({
                    branchId,
                    label: branchId,
                    status: deriveBranchStatus([branchNode]),
                    nodes: [branchNode],
                })
            }
        }

        // Phase 3: Build dependency edges from STEP.dependencyRefs
        const dependencyEdges: DependencyEdge[] = []
        for (const raw of r.nodes) {
            if (raw.structural.type === 'STEP') {
                const toNodeId = resolveStructuralId(raw)
                for (const ref of raw.structural.dependencyRefs) {
                    const fromNodeId = stepLookup.get(`${ref.branchId}::${ref.stepId}`)
                    if (fromNodeId) {
                        dependencyEdges.push({fromNodeId, toNodeId})
                    }
                }
            }
        }

        // Phase 4: Build BranchInputs
        const maxBranchLen = Math.max(1, ...orderedBranches.map(b => b.nodes.length))
        const spineLength = 3 + maxBranchLen

        const spineNodes: ResearchTreeNode[] = []
        if (scoutNode) spineNodes.push(scoutNode)
        if (planNode) spineNodes.push(planNode)

        const branchInputs: BranchInput[] = [
            {id: SPINE_BRANCH_ID, length: spineLength},
        ]
        for (const branch of orderedBranches) {
            branchInputs.push({
                id: branch.branchId,
                length: branch.nodes.length,
                parentId: SPINE_BRANCH_ID,
                forkPointIdx: 1
            })
        }

        engine.setBranches(branchInputs)

        return {
            layout: engine.layout,
            spine: {branchId: SPINE_BRANCH_ID, nodes: spineNodes, analysisNode},
            researchBranches: orderedBranches,
            nodeMap,
            dependencyEdges,
            branchInputs,
        }
    })
}

// --- Helpers ---

function toTreeNode(raw: ResearchNode): ResearchTreeNode {
    const structuralNodeId = resolveStructuralId(raw)
    return {
        id: structuralNodeId,
        nodeType: raw.nodeType,
        status: raw.status,
        structuralNodeId,
        summary: extractSummary(raw),
        createdAt: raw.status === 'PENDING' ? raw.startedAt : raw.createdAt,
        rawNode: raw,
    }
}

function resolveStructuralId(raw: ResearchNode): string {
    const s = raw.structural
    switch (s.type) {
        case 'SCOUT': return s.nodeId
        case 'PLAN': return s.nodeId
        case 'BRANCH': return `${s.nodeId}::${s.branchId}`
        case 'STEP': return `${s.nodeId}::${s.branchId}::${s.stepId}`
        case 'ANALYSIS': return s.nodeId
    }
}

function extractSummary(raw: ResearchNode): string | undefined {
    if (raw.status !== 'COMPLETED') return undefined
    const payload = raw.payload as Record<string, unknown> | undefined
    if (!payload) return undefined
    switch (raw.nodeType) {
        case 'SCOUT': return payload.complexity ? `Complexity: ${payload.complexity}` : undefined
        case 'PLAN': return payload.goal ? String(payload.goal) : undefined
        case 'STEP': return payload.keyInsight ? String(payload.keyInsight) : undefined
        case 'BRANCH': return payload.branchSummary ? String(payload.branchSummary) : undefined
        case 'ANALYSIS': return payload.mainConclusion ? String(payload.mainConclusion) : undefined
    }
}

function orderSteps(steps: ResearchTreeNode[], rawNodes: ResearchNode[]): ResearchTreeNode[] {
    if (steps.length <= 1) return steps

    const rawByNodeId = new Map<string, ResearchNode>()
    for (const raw of rawNodes) rawByNodeId.set(raw.structural.nodeId, raw)

    const stepById = new Map<string, ResearchTreeNode>()
    const prevMap = new Map<string, string | null>()

    for (const step of steps) {
        const raw = rawByNodeId.get(step.rawNode.structural.nodeId)
        if (raw && raw.structural.type === 'STEP') {
            stepById.set(raw.structural.stepId, step)
            prevMap.set(raw.structural.stepId, raw.structural.previousStepId)
        }
    }

    let currentId: string | null = null
    for (const [stepId, prevId] of prevMap) {
        if (!prevId) { currentId = stepId; break }
    }

    const ordered: ResearchTreeNode[] = []
    const visited = new Set<string>()
    while (currentId && stepById.has(currentId) && !visited.has(currentId)) {
        visited.add(currentId)
        ordered.push(stepById.get(currentId)!)
        let nextId: string | null = null
        for (const [stepId, prevId] of prevMap) {
            if (prevId === currentId) { nextId = stepId; break }
        }
        currentId = nextId
    }

    for (const step of steps) {
        if (!ordered.includes(step)) ordered.push(step)
    }
    return ordered
}

function deriveBranchStatus(nodes: ResearchTreeNode[]): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' {
    if (nodes.length === 0) return 'PENDING'
    if (nodes.some(n => n.status === 'FAILED')) return 'FAILED'
    if (nodes.every(n => n.status === 'COMPLETED')) return 'COMPLETED'
    if (nodes.some(n => n.status === 'COMPLETED' || n.status === 'PENDING')) return 'IN_PROGRESS'
    return 'PENDING'
}