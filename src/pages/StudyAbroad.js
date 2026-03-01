/**
 * 5ATTH | خته — الدراسة في الخارج (Study Abroad Page)
 */
import wixSeo from 'wix-seo';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import { getSectionContent, submitLead } from 'backend/cmsService.web';

const TENANT_ID = 'default';

$w.onReady(async function () {
  wixSeo.title = 'الدراسة في الخارج | 5ATTH خته';
  wixSeo.description = 'برامج دراسية في أفضل الجامعات العالمية - دراسة اللغة الإنجليزية، البكالوريوس، الماجستير، الدكتوراه';

  try {
    const programs = await getSectionContent(TENANT_ID, 'study_abroad');

    if ($w('#programsRepeater') && programs.length) {
      $w('#programsRepeater').data = programs.map(p => ({
        _id: p._id,
        title: p.title,
        image: p.heroMediaId,
        slug: p.slug,
        description: p.contentRichText?.substring(0, 150) || '',
      }));

      $w('#programsRepeater').onItemReady(($item, itemData) => {
        $item('#programTitle').text = itemData.title;
        if (itemData.image) $item('#programImage').src = itemData.image;
        if (itemData.description) $item('#programDesc').text = itemData.description;

        $item('#programCard').onMouseIn(() => {
          try { $item('#programCard').style.borderColor = '#C9A227'; } catch (e) {}
        });
        $item('#programCard').onMouseOut(() => {
          try { $item('#programCard').style.borderColor = '#2A2A35'; } catch (e) {}
        });

        $item('#programCta').onClick(() => {
          wixLocation.to(`/study-abroad/${itemData.slug}`);
        });
      });
    }
  } catch (e) {
    console.log('Failed to load study programs:', e);
  }

  // ─── Consultation Form ─────────────────────────────────
  if ($w('#studyConsultBtn')) {
    $w('#studyConsultBtn').onClick(async () => {
      const name = $w('#consultName')?.value || '';
      const phone = $w('#consultPhone')?.value || '';
      const destination = $w('#consultDest')?.value || '';

      if (!name || !phone) {
        if ($w('#consultError')) $w('#consultError').text = 'يرجى تعبئة الاسم ورقم الجوال';
        return;
      }

      try {
        await submitLead(TENANT_ID, {
          segmentKey: 'study_abroad',
          name,
          phone,
          destinationPreference: destination,
          source: 'study_abroad_page',
        });

        if ($w('#consultSuccess')) $w('#consultSuccess').expand();
        if ($w('#consultForm')) $w('#consultForm').collapse();
      } catch (e) {
        if ($w('#consultError')) $w('#consultError').text = 'حدث خطأ، يرجى المحاولة مرة أخرى';
      }
    });
  }
});
