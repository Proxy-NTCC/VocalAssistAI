# VocalAssistAI: Vernacular Ticket Routing & Multilingual Support Automation

## Problem Statement
Tier 2/3 retail chains receive support emails and WhatsApp feedback in diverse languages, overwhelming small teams and causing delayed or misrouted responses. Manual ticket handling lacks context-awareness and fails to leverage past resolutions, resulting in poor customer satisfaction.

## Description
This project is an n8n-powered, Docker-deployed automation that ingests multilingual support requests from email and WhatsApp webhooks, uses LLM agents for language detection, classification, and translation, and routes tickets to the appropriate Airtable dashboard based on urgency, topic, and location. Pinecone vector search retrieves similar historic tickets for quick reference, while auto-generated draft replies speed up support cycles.

## Tools & Stack
* n8n
* Docker Compose
* Airtable
* OpenAI API
* Pinecone
* IMAP Email

## Getting Started

1. Set up your `.env` file (or just use the docker-compose file directly).
2. Run `docker-compose up -d` to start the n8n instance.
3. Access n8n at `http://localhost:5678`.
