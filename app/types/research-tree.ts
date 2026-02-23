import type { ResearchNode } from '~/types/schemas'

export type ResearchTreeNode = {
  /** Unique identifier — matches the structural nodeId */
  id: string
  nodeType: 'SCOUT' | 'PLAN' | 'BRANCH' | 'STEP' | 'ANALYSIS'
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  /** Structural node identifier (e.g. "scout", "plan", "branch:marketing", "step:marketing:s1") */
  structuralNodeId: string
  /** Human-readable summary derived from payload */
  summary?: string
  /** ISO timestamp */
  createdAt: string
  /** Original raw node from the API */
  rawNode: ResearchNode
}

export type ResearchTreeBranch = {
  branchId: string
  label: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
  nodes: ResearchTreeNode[]
}