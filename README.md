
# ZEBA - SRE Agent Server

## Overview

ZEBA (AI-Powered SRE Agent) is an intelligent backend platform designed to support EV charging station operations through proactive monitoring, conversational AI, intelligent log analysis, and operational insights.

The platform helps Site Reliability Engineering (SRE) teams reduce manual monitoring effort, accelerate incident investigations, and improve operational visibility across EV charging infrastructure.

---

## Key Features

### Proactive Monitoring

- Continuous monitoring of EV station health
- Background health-check execution
- Operational visibility across charging infrastructure
- Intelligent monitoring workflows

### Conversational AI

- Natural language interaction
- Context-aware conversations
- Multi-turn investigations
- Session management
- Chat history management
- Thread-based conversations

### Intelligent Log Analysis

- Upload operational log files
- AI-powered log summarization
- Error identification
- Issue investigation support
- Conversational log analysis
- Root Cause Analysis (RCA) assistance

### Voice-Enabled Operations

- Voice interaction support
- Spoken AI responses
- Hands-free investigation workflows

### Station Intelligence

- Station operational insights
- Health evaluation
- Troubleshooting recommendations
- AI-assisted investigations

---

## Architecture

```text
                 EV Charging Stations
                           │
                           ▼

               Operational Monitoring Data

                           │
                           ▼

                ┌───────────────────┐
                │       ZEBA        │
                │ SRE Agent Server  │
                └───────────────────┘

       ┌─────────────┬─────────────┬─────────────┐
       ▼             ▼             ▼             ▼

  Monitoring     AI Agent      Log Analysis   RAG
    Agent         Engine          Engine      Layer

       └─────────────┬─────────────┬─────────────┘
                     ▼

              REST API Services

                     ▼

             Client Applications
```

---

## Core Components

### Monitoring Agent

Responsible for:

- Station monitoring
- Health evaluation
- Background monitoring workflows
- Operational awareness

### AI Agent Engine

Provides:

- Conversational AI
- Context retention
- Session management
- Multi-turn investigations

### Log Analysis Engine

Handles:

- Log ingestion
- Log understanding
- AI-powered summaries
- Investigation assistance

### RAG Layer

Provides:

- Knowledge retrieval
- Context enrichment
- Document grounding
- Enhanced AI responses

---

## API Endpoints

### Station Data

```http
GET /api/stations
```

#### Query Parameters

| Parameter | Description |
|-----------|-------------|
| startDate | Start time |
| endDate | End time |

#### Example

```http
GET /api/stations?startDate=2026-09-01&endDate=2026-09-30
```

---

### Agent APIs

```http
/api/agent/*
```

Provides:

- Conversational AI
- Log analysis
- Session management
- Investigation workflows

---

## Startup Workflow

```text
Application Start
        │
        ▼

Initialize Express Server
        │
        ▼

Load Knowledge Base (RAG)
        │
        ▼

Refresh Station Cache
        │
        ▼

Start Cache Scheduler
 (Every 20 Minutes)
        │
        ▼

Start Proactive Agent
  (Every 60 Seconds)
        │
        ▼

System Ready
```

---

## Technology Stack

### Backend

- Node.js
- Express.js

### AI Services

- Azure OpenAI
- Agent-Based Architecture
- Retrieval-Augmented Generation (RAG)

### Data Management

- Station Data Cache
- Session Management
- Conversation History

### Monitoring

- Background Scheduling
- Operational Data Processing
- Station Health Monitoring

---

## Current Capabilities

✅ Proactive Station Monitoring

✅ Context-Aware Conversations

✅ Conversation History

✅ Thread Management

✅ Intelligent Log Analysis

✅ AI-Generated Log Summaries

✅ AI-Assisted RCA Support

✅ Voice-Enabled Interaction

✅ Background Monitoring Services

✅ Station Health Visibility

---

## Future Enhancements

### Phase 2

- Advanced anomaly detection
- Intelligent alerting
- Automated operational insights

### Phase 3

- Incident management integration
- Automated ticket creation
- Ticket lifecycle management

### Phase 4

- Predictive operations
- Autonomous remediation
- Advanced operational intelligence

---

## Business Value

ZEBA enables engineering teams to:

- Reduce manual monitoring effort
- Improve operational visibility
- Accelerate log analysis
- Simplify incident investigations
- Improve troubleshooting efficiency
- Enable AI-assisted operational workflows

---

## Vision

From reactive operations to AI-assisted reliability engineering.

ZEBA aims to become an intelligent operational assistant that continuously monitors infrastructure, understands operational context, analyzes logs, and helps engineers resolve issues more efficiently.
