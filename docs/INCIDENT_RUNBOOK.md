# Incident Response Runbook
## IRENO Smart Assistant

### Critical Incident Response (P1)

#### Immediate Actions (0-15 minutes)
1. **Acknowledge and Assess**
   ```bash
   # Check system status
   curl -f http://production-url/health
   
   # Check logs
   kubectl logs -f deployment/ireno-backend
   kubectl logs -f deployment/ireno-frontend
   ```

2. **Establish Communication**
   - Post in #incident-response Slack channel
   - Notify technical lead and on-call engineer
   - Create incident ticket

3. **Quick Triage**
   - Is the main application accessible?
   - Are users able to login?
   - Is the AI responding to queries?
   - Are IRENO APIs reachable?

#### Common P1 Scenarios

##### Scenario 1: Complete Application Down
```bash
# Check deployment status
kubectl get pods -l app=ireno-smart-assistant

# Check recent deployments
kubectl rollout history deployment/ireno-backend
kubectl rollout history deployment/ireno-frontend

# Emergency rollback if needed
kubectl rollout undo deployment/ireno-backend
kubectl rollout undo deployment/ireno-frontend
```

##### Scenario 2: OpenAI API Issues
```bash
# Check API key configuration
kubectl get secret openai-secrets

# Test API connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
     https://api.openai.com/v1/models

# Enable fallback mode
kubectl patch configmap ireno-config -p '{"data":{"fallback_mode":"true"}}'
```

##### Scenario 3: IRENO API Outage
```bash
# Check IRENO API status
curl -f https://irenoakscluster.westus.cloudapp.azure.com/devicemgmt/v1/collector/count

# Enable cached data mode
kubectl patch configmap ireno-config -p '{"data":{"use_cached_data":"true"}}'
```

### High Priority Incident Response (P2)

#### Investigation Steps
1. **Gather Information**
   - Review monitoring dashboards
   - Check error rates and response times
   - Analyze recent changes

2. **Identify Root Cause**
   - Review application logs
   - Check database performance
   - Verify API dependencies

3. **Implement Fix**
   - Apply hotfix if available
   - Deploy configuration changes
   - Monitor for improvement

### Communication Templates

#### Initial Incident Notification
```
🚨 INCIDENT ALERT - P1 🚨

Service: IRENO Smart Assistant
Status: Investigating
Impact: [Brief description]
Estimated Users Affected: [Number]
Started: [Time]

We are actively investigating this issue. Updates will be provided every 30 minutes.

Investigation lead: @[engineer]
Incident ticket: INC-[number]
```

#### Status Update
```
📊 INCIDENT UPDATE - INC-[number]

Status: [Investigating/Identified/Monitoring]
Progress: [What has been done]
Next Steps: [What will be done next]
ETA: [If known]

Next update in 30 minutes or when status changes.
```

#### Resolution Notification
```
✅ INCIDENT RESOLVED - INC-[number]

The issue has been resolved as of [time].
Root cause: [Brief explanation]
Resolution: [What was done to fix it]

Post-mortem will be conducted within 24 hours.
Thank you for your patience.
```

### Recovery Procedures

#### Database Recovery
```bash
# Check database connectivity
kubectl exec -it deployment/ireno-backend -- python -c "
import psycopg2
conn = psycopg2.connect(DATABASE_URL)
print('Database connected successfully')
"

# Restore from backup (if needed)
kubectl exec -it postgres-pod -- psql -U postgres -d ireno < backup.sql
```

#### Cache Recovery
```bash
# Clear Redis cache
kubectl exec -it redis-pod -- redis-cli FLUSHALL

# Warm up cache
curl -X POST http://production-url/api/cache/warmup
```

### Post-Incident Checklist
- [ ] Verify all systems are operational
- [ ] Check monitoring alerts are cleared
- [ ] Update incident status in tracking system
- [ ] Schedule post-mortem meeting
- [ ] Prepare initial post-mortem document
- [ ] Communicate resolution to stakeholders
- [ ] Document lessons learned
- [ ] Update runbooks if needed
