export const AUDIT_SYSTEM_PROMPT = `You are an AI assistant helping conduct business process audits for an AI automation agency called Inerci AI. Your goal is to help identify processes that could be automated or improved with AI.

During the audit conversation:
1. Ask clarifying questions to understand the client's current processes
2. Identify pain points, inefficiencies, and manual work
3. Gather metrics like time spent, frequency, volume, and who owns each process
4. Note any assumptions you're making that need verification
5. Be conversational and professional

Focus on discovering:
- Repetitive manual tasks
- Data entry and transfer between systems
- Document processing (invoices, contracts, emails)
- Customer communication patterns
- Reporting and analytics needs
- Integration gaps between tools

Keep responses concise but thorough. Ask one or two questions at a time.`

export const LIVE_SUMMARY_PROMPT = `Based on the conversation so far, provide a brief summary of the key information gathered. Structure it as:

**Company Overview:**
- Industry and size
- Main business activities

**Processes Identified:**
- Process name: Brief description, estimated time/frequency

**Pain Points:**
- Key issues mentioned

**Next Steps:**
- What needs more clarification

Keep it concise and factual.`

export const FOLLOW_UP_QUESTIONS_PROMPT = `Based on the conversation so far, suggest 3-4 follow-up questions the interviewer could ask to gather more useful information for the AI automation audit.

Focus on questions that will:
1. Uncover hidden processes that might benefit from automation
2. Quantify time/cost spent on manual work
3. Understand the tech stack and integration points
4. Identify decision-making patterns that could be AI-assisted

Format as a simple numbered list.`

export const TOP_PROCESSES_PROMPT = `Analyze the conversation and identify the top automation opportunities. For each process, provide:

1. **Process Name**
   - Description: What the process involves
   - Pain Points: Current issues
   - Automation Potential: (1-5 score with brief justification)
   - Estimated Impact: Time/cost savings potential
   - Assumptions: What we're assuming that needs verification

Rank them by automation potential and impact. Focus on processes where AI can provide the most value.`

export const PROPOSAL_DRAFT_PROMPT = `Based on the audit conversation and identified processes, draft a proposal for AI automation services. Include:

## Executive Summary
Brief overview of the client's situation and our recommended approach.

## Current State Assessment
Summary of the processes reviewed and key pain points identified.

## Recommended Solutions
For each prioritized process:
- The problem
- Proposed AI solution
- Expected benefits
- Implementation approach

## Pilot Recommendation
Which process to start with and why.

## Timeline & Investment
High-level timeline and pricing structure.

## Next Steps
Concrete actions to move forward.

Write in a professional but approachable tone. Be specific about the AI solutions being proposed.`

export const SECTION_REGEN_PROMPT = (sectionName: string, instruction: string) => `
Regenerate the "${sectionName}" section of the proposal with the following modification:

${instruction}

Maintain the same professional tone and format. Only output the regenerated section content, not the full proposal.
`

export const ROI_ESTIMATE_PROMPT = `Based on the identified processes and metrics discussed, provide a rough ROI estimate for implementing AI automation:

**Current Costs (Monthly)**
- Time spent on manual work
- Estimated labor cost
- Error/rework costs

**Projected Savings**
- Time reduction estimates
- Cost savings
- Quality improvements

**ROI Timeline**
- Implementation investment
- Monthly savings
- Break-even estimate

Note clearly which numbers are estimates vs. discussed figures.`
