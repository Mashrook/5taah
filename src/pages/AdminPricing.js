/**
 * 5ATTH | خته — Admin Pricing (Markup Rules)
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import { checkPermission } from 'backend/rbacService.web';
import { getMarkupRules, saveMarkupRule, deleteMarkupRule } from 'backend/pricingService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة التسعير | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'pricing_view');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  const canEdit = await checkPermission(TENANT_ID, userId, 'pricing_edit');

  // ─── Load Rules ────────────────────────────────────────
  async function loadRules() {
    if ($w('#pricingLoading')) $w('#pricingLoading').expand();

    try {
      const rules = await getMarkupRules(TENANT_ID);

      if ($w('#rulesRepeater')) {
        $w('#rulesRepeater').data = rules.map((r, i) => ({ _id: String(i), ...r }));

        $w('#rulesRepeater').onItemReady(($item, data) => {
          if ($item('#ruleName')) $item('#ruleName').text = data.ruleName || '-';
          if ($item('#ruleType')) $item('#ruleType').text = data.markupType === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت';
          if ($item('#ruleValue')) {
            $item('#ruleValue').text = data.markupType === 'percentage' ? `${data.markupValue}%` : `${data.markupValue}`;
            try { $item('#ruleValue').style.color = '#C9A227'; } catch (e) {}
          }
          if ($item('#ruleScope')) {
            const scopes = [];
            if (data.scope?.productType) scopes.push(data.scope.productType);
            if (data.scope?.providerName) scopes.push(data.scope.providerName);
            if (data.scope?.cabin) scopes.push(data.scope.cabin);
            if (data.scope?.season) scopes.push(data.scope.season);
            $item('#ruleScope').text = scopes.join(' | ') || 'عام';
          }
          if ($item('#rulePriority')) $item('#rulePriority').text = `أولوية: ${data.priority || 0}`;

          // Edit
          if ($item('#ruleEditBtn') && canEdit) {
            $item('#ruleEditBtn').onClick(() => openRuleEditor(data));
          } else if ($item('#ruleEditBtn')) {
            $item('#ruleEditBtn').collapse();
          }

          // Delete
          if ($item('#ruleDeleteBtn') && canEdit) {
            $item('#ruleDeleteBtn').onClick(async () => {
              $item('#ruleDeleteBtn').disable();
              try {
                await deleteMarkupRule(TENANT_ID, data._id);
                await loadRules();
              } catch (e) {
                console.log('Delete rule error:', e);
              }
              $item('#ruleDeleteBtn').enable();
            });
          } else if ($item('#ruleDeleteBtn')) {
            $item('#ruleDeleteBtn').collapse();
          }
        });
      }

      if ($w('#rulesCount')) $w('#rulesCount').text = `${rules.length} قاعدة`;
    } catch (e) {
      if ($w('#pricingError')) $w('#pricingError').text = `خطأ: ${e.message}`;
    }

    if ($w('#pricingLoading')) $w('#pricingLoading').collapse();
  }

  // ─── Rule Editor ───────────────────────────────────────
  function openRuleEditor(rule = {}) {
    if ($w('#ruleEditor')) $w('#ruleEditor').expand();
    if ($w('#editRuleName')) $w('#editRuleName').value = rule.ruleName || '';
    if ($w('#editRuleType')) $w('#editRuleType').value = rule.markupType || 'percentage';
    if ($w('#editRuleValue')) $w('#editRuleValue').value = rule.markupValue || 0;
    if ($w('#editRulePriority')) $w('#editRulePriority').value = rule.priority || 0;
    if ($w('#editRuleProduct')) $w('#editRuleProduct').value = rule.scope?.productType || '';
    if ($w('#editRuleProvider')) $w('#editRuleProvider').value = rule.scope?.providerName || '';
    if ($w('#editRuleCabin')) $w('#editRuleCabin').value = rule.scope?.cabin || '';
    if ($w('#editRuleSeason')) $w('#editRuleSeason').value = rule.scope?.season || '';
    if ($w('#editRuleSegment')) $w('#editRuleSegment').value = rule.scope?.segment || '';
    if ($w('#editRuleRoute')) $w('#editRuleRoute').value = rule.scope?.route || '';
    if ($w('#editRuleId')) $w('#editRuleId').value = rule._id || '';
  }

  if ($w('#addRuleBtn') && canEdit) {
    $w('#addRuleBtn').onClick(() => openRuleEditor());
  } else if ($w('#addRuleBtn')) {
    $w('#addRuleBtn').collapse();
  }

  if ($w('#saveRuleBtn')) {
    $w('#saveRuleBtn').onClick(async () => {
      const ruleData = {
        ruleName: $w('#editRuleName')?.value,
        markupType: $w('#editRuleType')?.value || 'percentage',
        markupValue: Number($w('#editRuleValue')?.value) || 0,
        priority: Number($w('#editRulePriority')?.value) || 0,
        scope: {
          productType: $w('#editRuleProduct')?.value || undefined,
          providerName: $w('#editRuleProvider')?.value || undefined,
          cabin: $w('#editRuleCabin')?.value || undefined,
          season: $w('#editRuleSeason')?.value || undefined,
          segment: $w('#editRuleSegment')?.value || undefined,
          route: $w('#editRuleRoute')?.value || undefined,
        },
      };

      const existingId = $w('#editRuleId')?.value;
      if (existingId) ruleData._id = existingId;

      try {
        await saveMarkupRule(TENANT_ID, ruleData);
        if ($w('#ruleEditor')) $w('#ruleEditor').collapse();
        await loadRules();
      } catch (e) {
        if ($w('#ruleEditorError')) $w('#ruleEditorError').text = e.message;
      }
    });
  }

  if ($w('#cancelRuleBtn')) {
    $w('#cancelRuleBtn').onClick(() => {
      if ($w('#ruleEditor')) $w('#ruleEditor').collapse();
    });
  }

  // ─── Initial Load ──────────────────────────────────────
  await loadRules();
});
