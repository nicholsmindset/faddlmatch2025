# 🛠️ FADDL Match Production Operations Runbook

**Version**: 1.0 | **Last Updated**: August 2025  
**Status**: Production Ready | **Islamic Compliance**: Verified

---

## 📋 **Quick Reference Dashboard**

### **Critical System URLs**
- **Production Site**: https://faddlmatch.com
- **Health Check**: https://faddlmatch.com/api/health  
- **Admin Dashboard**: https://faddlmatch.com/api/admin/dashboard
- **Stripe Dashboard**: https://dashboard.stripe.com
- **Supabase Console**: https://supabase.com/dashboard
- **Netlify Deploy**: https://app.netlify.com

### **Emergency Contacts**
- **Technical Lead**: [Your Contact]
- **Business Lead**: [Your Contact] 
- **Islamic Compliance Officer**: [Your Contact]
- **Customer Support**: support@faddlmatch.com

---

## 🚨 **Emergency Response Procedures**

### **Critical System Failure (P0)**
**Response Time**: Immediate (< 5 minutes)

```bash
# Emergency Rollback Procedure
1. Access Netlify Dashboard
2. Go to "Deploys" → Select previous stable version
3. Click "Publish deploy" to rollback
4. Verify https://faddlmatch.com/api/health returns 200
5. Notify all stakeholders immediately
```

**Escalation Path**:
1. Technical Lead → Immediate notification
2. Business Lead → Within 15 minutes  
3. Legal/Compliance → If Islamic compliance affected
4. Public Communication → Within 1 hour if user-facing

### **Payment System Issues (P0)**
**Response Time**: Immediate (< 5 minutes)

```bash
# Stripe Payment Failure Response
1. Check Stripe Dashboard → Events → Filter by "failed"
2. Verify webhook endpoint status
3. Check /api/webhooks/stripe logs
4. If widespread: Enable maintenance mode
5. Contact Stripe support if needed
```

**Immediate Actions**:
- [ ] Verify Stripe API status
- [ ] Check webhook endpoint health  
- [ ] Review failed payment logs
- [ ] Contact affected customers
- [ ] Document incident for review

### **Database Connection Loss (P1)**
**Response Time**: < 15 minutes

```bash
# Supabase Database Issue Response
1. Check Supabase status page
2. Verify connection pool status
3. Review /api/health database section
4. Restart application if needed
5. Check RLS policies if partial failure
```

---

## 📊 **Monitoring & Alerting**

### **Key Performance Indicators (KPIs)**

#### **Business Metrics** (Check Daily)
- **Monthly Recurring Revenue**: Target growth >10%
- **Subscription Conversion Rate**: Target >5%
- **Payment Success Rate**: Target >95%  
- **Customer Churn Rate**: Target <5%
- **Islamic Compliance Score**: Target 100%

#### **Technical Metrics** (Monitor Hourly)
- **System Uptime**: Target 99.9%
- **API Response Time**: Target <500ms
- **Error Rate**: Target <1%
- **Database Performance**: Target <200ms queries
- **CDN Cache Hit Rate**: Target >90%

### **Alert Thresholds**

#### **Critical Alerts (P0)**
- Payment success rate drops below 90%
- System uptime below 99%
- Database connection failures
- Islamic compliance violations
- Security breach indicators

#### **Warning Alerts (P1)**  
- Response time >1 second sustained
- Error rate >2% for 10 minutes
- Failed payment rate >10%
- Low cache hit rate <80%
- High memory usage >80%

### **Monitoring Commands**

```bash
# System Health Check
curl -s https://faddlmatch.com/api/health | jq '.'

# Subscription Status Check  
curl -s https://faddlmatch.com/api/admin/dashboard | jq '.business'

# Performance Metrics
curl -s https://faddlmatch.com/api/health | jq '.performance'

# Islamic Compliance Check
curl -s https://faddlmatch.com/api/health | jq '.security'
```

---

## 💳 **Payment System Operations**

### **Stripe Configuration Management**

#### **Production Environment Variables**
```bash
# Required Stripe Variables (Verify Monthly)
STRIPE_SECRET_KEY=sk_live_... 
STRIPE_PATIENCE_PRICE_ID=price_...
STRIPE_RELIANCE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Webhook Monitoring**
- **Endpoint**: https://faddlmatch.com/api/webhooks/stripe
- **Events**: subscription.*, invoice.*, checkout.session.completed
- **Expected Response**: 200 OK within 3 seconds
- **Retry Policy**: 3 attempts with exponential backoff

### **Subscription Lifecycle Management**

#### **New Subscription Flow**
1. User completes Stripe Checkout
2. `checkout.session.completed` webhook received
3. Subscription created in database
4. User permissions updated
5. Welcome email sent
6. Islamic compliance verification

#### **Failed Payment Handling**
1. `invoice.payment_failed` webhook received
2. Grace period begins (7 days)
3. Customer notification sent
4. Payment retry attempted (3x)
5. Subscription downgraded if still failed
6. Account suspension after 14 days

#### **Cancellation Process**
1. User requests cancellation
2. Immediate feature access removal
3. Subscription marked for end of period
4. Refund processing if applicable
5. Exit survey and feedback collection
6. Account data retention per policy

---

## 🕌 **Islamic Compliance Operations**

### **Daily Compliance Checks**

#### **Content Moderation Review**
- [ ] Review flagged messages and profiles
- [ ] Verify guardian approval workflows
- [ ] Check for inappropriate content
- [ ] Validate prayer time integrations
- [ ] Confirm halal interaction guidelines

#### **Cultural Sensitivity Monitoring**
- [ ] Monitor customer feedback for cultural issues
- [ ] Review guardian system effectiveness  
- [ ] Check Islamic calendar integration
- [ ] Validate modesty control usage
- [ ] Assess family involvement metrics

### **Prayer Time Integration**

#### **Singapore Prayer Times** (Update Monthly)
```javascript
// Prayer time API integration
const prayerTimes = {
  fajr: "05:45",
  dhuhr: "13:15", 
  asr: "16:45",
  maghrib: "19:30",
  isha: "20:45"
}
```

#### **Ramadan/Hajj Considerations**
- **Communication**: Reduced notification frequency
- **Features**: Enhanced family coordination
- **Support**: Extended cultural sensitivity
- **Marketing**: Respectful messaging timing

---

## 🔧 **Maintenance Procedures**

### **Scheduled Maintenance Windows**
- **Preferred Time**: Saturday 2:00-4:00 AM SGT
- **Duration**: Maximum 2 hours
- **Notification**: 48 hours advance notice
- **Rollback Plan**: Always prepared

### **Database Maintenance**

#### **Weekly Tasks**
```sql
-- Performance optimization queries
VACUUM ANALYZE user_profiles;
VACUUM ANALYZE user_subscriptions;
VACUUM ANALYZE matches;

-- Index health check
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes ORDER BY idx_tup_read DESC;
```

#### **Monthly Tasks**
- [ ] Review and update database statistics
- [ ] Check and rebuild indexes if needed
- [ ] Backup verification and restoration test
- [ ] Archive old data per retention policy
- [ ] Security audit and access review

### **Deployment Procedures**

#### **Standard Deployment**
```bash
# Pre-deployment checklist
1. Run test suite: npm run test:all
2. Verify environment variables
3. Check Stripe webhook configuration  
4. Validate Islamic compliance features
5. Deploy to staging for final validation
6. Deploy to production during maintenance window
7. Monitor for 30 minutes post-deployment
```

#### **Hotfix Deployment**
```bash
# Emergency hotfix procedure
1. Create hotfix branch from main
2. Implement minimal fix
3. Run critical tests only
4. Deploy directly to production
5. Monitor immediately for issues
6. Follow up with full testing cycle
```

---

## 📞 **Customer Support Procedures**

### **Subscription Issues**

#### **Payment Failures**
1. **Verify**: Check Stripe dashboard for payment details
2. **Diagnose**: Common causes (expired card, insufficient funds)
3. **Resolve**: Guide customer through payment update
4. **Follow-up**: Confirm subscription reactivation
5. **Document**: Log issue and resolution

#### **Feature Access Problems**  
1. **Verify**: Check user subscription status in database
2. **Diagnose**: Subscription sync issues or expired status
3. **Resolve**: Manually sync or extend access if appropriate
4. **Follow-up**: Ensure all features are accessible
5. **Document**: Note any system sync issues

### **Islamic Compliance Support**

#### **Guardian System Issues**
1. **Verify**: Check guardian relationship status
2. **Diagnose**: Permission settings or notification problems
3. **Resolve**: Adjust settings or resend invitations
4. **Follow-up**: Confirm family approval workflow
5. **Cultural**: Ensure respectful communication

#### **Cultural Sensitivity Concerns**
1. **Listen**: Allow customer to express concerns fully
2. **Acknowledge**: Validate cultural importance
3. **Escalate**: Involve Islamic compliance officer if needed
4. **Resolve**: Make appropriate adjustments
5. **Follow-up**: Ensure satisfaction and respect

---

## 🔐 **Security Operations**

### **Security Monitoring**

#### **Daily Security Checks**
- [ ] Review authentication failure logs
- [ ] Check for unusual login patterns
- [ ] Verify webhook signature validations
- [ ] Monitor rate limiting effectiveness
- [ ] Assess suspicious activity alerts

#### **Weekly Security Tasks**
- [ ] Update dependencies and security patches
- [ ] Review user access permissions
- [ ] Audit payment processing logs
- [ ] Check SSL certificate status
- [ ] Validate backup encryption

### **Incident Response**

#### **Security Breach Protocol**
1. **Immediate**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Contain**: Prevent further access
4. **Notify**: Legal, compliance, and affected users
5. **Remediate**: Fix vulnerabilities  
6. **Document**: Full incident report
7. **Follow-up**: Lessons learned and improvements

---

## 📈 **Business Intelligence**

### **Analytics Dashboard**

#### **Key Metrics Tracking**
```sql
-- Daily subscription metrics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_subscriptions,
  plan_id,
  AVG(amount) as avg_revenue
FROM user_subscriptions 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), plan_id
ORDER BY date DESC;
```

#### **Islamic Compliance Metrics**
```sql
-- Guardian system usage
SELECT 
  COUNT(*) as total_users,
  COUNT(guardian_id) as users_with_guardians,
  (COUNT(guardian_id) * 100.0 / COUNT(*)) as guardian_adoption_rate
FROM user_profiles;
```

### **Monthly Business Review**

#### **Subscription Analysis**
- [ ] Revenue growth trends
- [ ] Plan conversion patterns  
- [ ] Churn analysis and reasons
- [ ] Customer lifetime value
- [ ] Islamic compliance satisfaction

#### **Operational Review**
- [ ] System performance trends
- [ ] Security incident summary
- [ ] Customer support metrics
- [ ] Cultural sensitivity feedback
- [ ] Feature usage analytics

---

## 🗃️ **Data Management**

### **Backup & Recovery**

#### **Automated Backups**
- **Database**: Daily at 2:00 AM SGT (Supabase managed)
- **Application**: Git repository with tags
- **Configuration**: Environment variables backed up weekly
- **Retention**: 30 days production, 7 days staging

#### **Disaster Recovery**
- **RTO** (Recovery Time Objective): 4 hours
- **RPO** (Recovery Point Objective): 1 hour
- **Backup Testing**: Monthly restoration verification
- **Documentation**: Step-by-step recovery procedures

### **Data Retention Policy**

#### **User Data**
- **Active Users**: Indefinite retention
- **Inactive Users**: 2 years after last login
- **Cancelled Subscriptions**: 1 year for support
- **Payment Data**: 7 years for compliance
- **Islamic Compliance**: Permanent for auditing

---

## 📚 **Documentation & Training**

### **Team Knowledge Base**

#### **Technical Documentation**
- [ ] System architecture diagrams
- [ ] API documentation and examples
- [ ] Database schema and relationships
- [ ] Deployment procedures and rollback
- [ ] Islamic compliance requirements

#### **Business Documentation**  
- [ ] Subscription plan details and pricing
- [ ] Customer support scripts and FAQs
- [ ] Islamic cultural guidelines
- [ ] Marketing compliance requirements
- [ ] Legal and regulatory obligations

### **Training Requirements**

#### **New Team Member Onboarding**
1. **Technical**: System architecture and codebase
2. **Business**: Islamic matrimonial platform concepts
3. **Cultural**: Islamic values and compliance requirements
4. **Support**: Customer service with cultural sensitivity
5. **Security**: Data protection and privacy requirements

---

## ✅ **Operational Checklists**

### **Daily Operations Checklist**
- [ ] Check system health endpoint
- [ ] Review overnight alerts and incidents
- [ ] Verify payment processing success rate
- [ ] Monitor subscription conversion metrics
- [ ] Review Islamic compliance reports
- [ ] Check customer support queue

### **Weekly Operations Checklist**
- [ ] Review system performance trends
- [ ] Update security patches and dependencies
- [ ] Analyze subscription and revenue metrics
- [ ] Audit user access and permissions
- [ ] Test backup and recovery procedures
- [ ] Review cultural sensitivity feedback

### **Monthly Operations Checklist**
- [ ] Comprehensive security audit
- [ ] Database performance optimization
- [ ] Business metrics analysis and reporting
- [ ] Islamic compliance assessment
- [ ] Customer satisfaction survey review
- [ ] Operational procedure updates

---

*This runbook ensures smooth, culturally-sensitive operations of the FADDL Match platform with emphasis on Islamic compliance, system reliability, and exceptional customer experience.*