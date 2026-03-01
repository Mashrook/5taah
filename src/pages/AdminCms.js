/**
 * 5ATTH | خته — Admin CMS Management
 */
import wixSeo from 'wix-seo';
import wixUsers from 'wix-users';
import { checkPermission } from 'backend/rbacService.web';
import { getArticles, saveArticle, getSectionContent, savePage, getCuratedOffers, saveCuratedOffer, getFeatureFlags, toggleFeatureFlag } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'إدارة المحتوى | 5ATTH خته';

  const userId = wixUsers.currentUser.id;
  const allowed = await checkPermission(TENANT_ID, userId, 'cms_edit');
  if (!allowed) {
    if ($w('#accessDenied')) $w('#accessDenied').expand();
    return;
  }

  let activeTab = 'articles';

  // ─── Tab Switching ─────────────────────────────────────
  const tabs = ['articles', 'pages', 'offers', 'flags'];
  const tabLabels = { articles: 'المقالات', pages: 'الصفحات', offers: 'العروض المميزة', flags: 'أعلام الميزات' };

  tabs.forEach(tab => {
    const selector = `#tab_${tab}`;
    if ($w(selector)) {
      $w(selector).onClick(() => {
        activeTab = tab;
        updateTabs();
        loadContent();
      });
    }
  });

  function updateTabs() {
    tabs.forEach(tab => {
      const selector = `#tab_${tab}`;
      if ($w(selector)) {
        try {
          $w(selector).style.backgroundColor = tab === activeTab ? '#C9A227' : '#1E1E27';
          $w(selector).style.color = tab === activeTab ? '#0E0E12' : '#9AA0A6';
        } catch (e) {}
      }
    });

    ['#articlesSection', '#pagesSection', '#offersSection', '#flagsSection'].forEach(s => {
      if ($w(s)) $w(s).collapse();
    });
    const sectionMap = { articles: '#articlesSection', pages: '#pagesSection', offers: '#offersSection', flags: '#flagsSection' };
    if ($w(sectionMap[activeTab])) $w(sectionMap[activeTab]).expand();
  }

  async function loadContent() {
    if (activeTab === 'articles') await loadArticles();
    else if (activeTab === 'pages') await loadPages();
    else if (activeTab === 'offers') await loadOffers();
    else if (activeTab === 'flags') await loadFlags();
  }

  // ─── Articles ──────────────────────────────────────────
  async function loadArticles() {
    try {
      const articles = await getArticles(TENANT_ID);
      if ($w('#articlesRepeater')) {
        $w('#articlesRepeater').data = articles.map((a, i) => ({ _id: String(i), ...a }));
        $w('#articlesRepeater').onItemReady(($item, data) => {
          if ($item('#artTitle')) $item('#artTitle').text = data.title || '-';
          if ($item('#artSlug')) $item('#artSlug').text = data.slug || '-';
          if ($item('#artStatus')) {
            $item('#artStatus').text = data.isPublished ? 'منشور' : 'مسودة';
            try { $item('#artStatus').style.color = data.isPublished ? '#22C55E' : '#9AA0A6'; } catch (e) {}
          }
          if ($item('#artEditBtn')) {
            $item('#artEditBtn').onClick(() => {
              if ($w('#editArticleTitle')) $w('#editArticleTitle').value = data.title || '';
              if ($w('#editArticleSlug')) $w('#editArticleSlug').value = data.slug || '';
              if ($w('#editArticleBody')) $w('#editArticleBody').value = data.bodyHtml || '';
              if ($w('#editArticleCategory')) $w('#editArticleCategory').value = data.category || '';
              if ($w('#editArticlePublished')) $w('#editArticlePublished').checked = data.isPublished || false;
              if ($w('#editArticleId')) $w('#editArticleId').value = data._id || '';
              if ($w('#articleEditor')) $w('#articleEditor').expand();
            });
          }
        });
      }
    } catch (e) {
      console.log('Load articles error:', e);
    }
  }

  if ($w('#saveArticleBtn')) {
    $w('#saveArticleBtn').onClick(async () => {
      const articleData = {
        title: $w('#editArticleTitle')?.value,
        slug: $w('#editArticleSlug')?.value,
        bodyHtml: $w('#editArticleBody')?.value,
        category: $w('#editArticleCategory')?.value,
        isPublished: $w('#editArticlePublished')?.checked,
      };
      try {
        await saveArticle(TENANT_ID, articleData);
        if ($w('#articleEditor')) $w('#articleEditor').collapse();
        await loadArticles();
      } catch (e) {
        if ($w('#artEditorError')) $w('#artEditorError').text = e.message;
      }
    });
  }

  // ─── Pages ─────────────────────────────────────────────
  async function loadPages() {
    try {
      const sections = ['home', 'offers', 'tours', 'destinations', 'study_abroad', 'saudi_tourism'];
      if ($w('#pagesRepeater')) {
        $w('#pagesRepeater').data = sections.map((s, i) => ({ _id: String(i), section: s }));
        $w('#pagesRepeater').onItemReady(async ($item, data) => {
          if ($item('#pageSection')) $item('#pageSection').text = data.section;
          if ($item('#pageEditBtn')) {
            $item('#pageEditBtn').onClick(async () => {
              const content = await getSectionContent(TENANT_ID, data.section, 'ar');
              if ($w('#editPageSection')) $w('#editPageSection').value = data.section;
              if ($w('#editPageTitle')) $w('#editPageTitle').value = content?.title || '';
              if ($w('#editPageContent')) $w('#editPageContent').value = content?.bodyJson || '';
              if ($w('#pageEditor')) $w('#pageEditor').expand();
            });
          }
        });
      }
    } catch (e) {
      console.log('Load pages error:', e);
    }
  }

  if ($w('#savePageBtn')) {
    $w('#savePageBtn').onClick(async () => {
      const pageData = {
        section: $w('#editPageSection')?.value,
        title: $w('#editPageTitle')?.value,
        bodyJson: $w('#editPageContent')?.value,
        lang: 'ar',
      };
      try {
        await savePage(TENANT_ID, pageData);
        if ($w('#pageEditor')) $w('#pageEditor').collapse();
      } catch (e) {
        if ($w('#pageEditorError')) $w('#pageEditorError').text = e.message;
      }
    });
  }

  // ─── Curated Offers ────────────────────────────────────
  async function loadOffers() {
    try {
      const offers = await getCuratedOffers(TENANT_ID, 'all');
      if ($w('#offersRepeater')) {
        $w('#offersRepeater').data = offers.map((o, i) => ({ _id: String(i), ...o }));
        $w('#offersRepeater').onItemReady(($item, data) => {
          if ($item('#offerTitle')) $item('#offerTitle').text = data.title || '-';
          if ($item('#offerSegment')) $item('#offerSegment').text = data.segment || '-';
          if ($item('#offerPrice')) {
            $item('#offerPrice').text = `${data.priceFrom} ${data.currency}`;
            try { $item('#offerPrice').style.color = '#C9A227'; } catch (e) {}
          }
          if ($item('#offerActive')) {
            $item('#offerActive').text = data.isActive ? 'نشط' : 'غير نشط';
          }
        });
      }
    } catch (e) {
      console.log('Load curated offers error:', e);
    }
  }

  // ─── Feature Flags ────────────────────────────────────
  async function loadFlags() {
    try {
      const flags = await getFeatureFlags(TENANT_ID);
      if ($w('#flagsRepeater')) {
        $w('#flagsRepeater').data = flags.map((f, i) => ({ _id: String(i), ...f }));
        $w('#flagsRepeater').onItemReady(($item, data) => {
          if ($item('#flagKey')) $item('#flagKey').text = data.flagKey || '-';
          if ($item('#flagEnabled')) {
            $item('#flagEnabled').text = data.enabled ? 'مفعل' : 'معطل';
            try { $item('#flagEnabled').style.color = data.enabled ? '#22C55E' : '#EF4444'; } catch (e) {}
          }
          if ($item('#flagToggle')) {
            $item('#flagToggle').onClick(async () => {
              try {
                await toggleFeatureFlag(TENANT_ID, data.flagKey, !data.enabled);
                await loadFlags();
              } catch (e) {
                console.log('Toggle flag error:', e);
              }
            });
          }
        });
      }
    } catch (e) {
      console.log('Load flags error:', e);
    }
  }

  // ─── Initial Load ──────────────────────────────────────
  updateTabs();
  await loadContent();
});
