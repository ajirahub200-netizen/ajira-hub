export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =====================================================
    // JOB PREVIEW
    //
    // /job?slug=my-job
    // /job/my-job
    // =====================================================

    if (
      url.pathname === "/job" ||
      url.pathname.startsWith("/job/")
    ) {
      return handleJob(request, env);
    }

    // =====================================================
    // ALL OTHER WEBSITE PAGES
    // =====================================================

    return env.ASSETS.fetch(request);
  },
};


// =========================================================
// JOB HANDLER
// =========================================================

async function handleJob(request, env) {
  const url = new URL(request.url);

  // =====================================================
  // GET SLUG
  // =====================================================

  let slug = url.searchParams.get("slug");

  // Support:
  // /job/my-job-slug
  if (!slug && url.pathname.startsWith("/job/")) {
    slug = url.pathname
      .substring("/job/".length)
      .split("/")[0];
  }

  // No slug
  if (!slug) {
    return serveJobPage(request, env);
  }


  // =====================================================
  // SUPABASE
  // =====================================================

  const SUPABASE_URL =
    "https://jvgvmnzekjkaakgqkoct.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_5h9e4kX950OSHjhKvcGTDg_X8AILbMk";


  try {

    // ===================================================
    // LOAD JOB PAGE IN PARALLEL WITH SUPABASE REQUEST
    // This reduces the wait time for clean /job/<slug> links.
    // ===================================================

    const jobPageUrl = new URL("/job.html", url.origin);

    const jobPagePromise = env.ASSETS.fetch(
      new Request(jobPageUrl, {
        method: "GET",
        headers: request.headers
      })
    );

    // ===================================================
    // GET JOB FROM SUPABASE
    // ===================================================

    const jobParams = new URLSearchParams();

    jobParams.set("select", "*");
    jobParams.set("slug", `eq.${slug}`);
    jobParams.set("status", "eq.published");
    jobParams.set("limit", "1");

    const jobApiUrl =
      `${SUPABASE_URL}/rest/v1/jobs?${jobParams.toString()}`;

    const jobResponse = await fetch(
      jobApiUrl,
      {
        method: "GET",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          Accept: "application/json"
        }
      }
    );


    // ===================================================
    // SUPABASE ERROR
    // ===================================================

    if (!jobResponse.ok) {

      console.error(
        "Supabase job request failed:",
        await jobResponse.text()
      );

      return serveJobPage(request, env);
    }


    const jobs =
      await jobResponse.json();


    // ===================================================
    // JOB NOT FOUND
    // ===================================================

    if (
      !Array.isArray(jobs) ||
      jobs.length === 0
    ) {

      return serveJobPage(request, env);
    }


    const job = jobs[0];


    // ===================================================
    // BASIC JOB INFORMATION
    // =====================================================

    const jobTitle =
      job.title ||
      "Ajira & Connection Hub TZ";

    const location =
      job.location ||
      "Tanzania";

    const jobType =
      job.job_type ||
      "Full Time";

    const description =
      cleanText(
        job.description || ""
      );

    const previewDescription =
      makePreviewDescription(description);


    // ===================================================
    // COMPANY INFORMATION
    // =====================================================

    let companyName =
      job.company_name ||
      "";

    let companyLogo =
      job.company_logo_url ||
      "";


    // ===================================================
    // GET COMPANY
    // =====================================================

    if (job.company_id) {

      try {

        const companyParams =
          new URLSearchParams();

        companyParams.set(
          "select",
          "name,logo_url"
        );

        companyParams.set(
          "id",
          `eq.${job.company_id}`
        );

        companyParams.set(
          "limit",
          "1"
        );


        const companyApiUrl =
          `${SUPABASE_URL}/rest/v1/companies?${companyParams.toString()}`;


        const companyResponse =
          await fetch(
            companyApiUrl,
            {
              method: "GET",

              headers: {
                apikey:
                  SUPABASE_KEY,

                Authorization:
                  `Bearer ${SUPABASE_KEY}`,

                Accept:
                  "application/json"
              }
            }
          );


        if (companyResponse.ok) {

          const companies =
            await companyResponse.json();


          if (
            Array.isArray(companies) &&
            companies.length > 0
          ) {

            const company =
              companies[0];


            companyName =
              company.name ||
              companyName;


            companyLogo =
              company.logo_url ||
              companyLogo;
          }
        }

      } catch (error) {

        console.error(
          "Company lookup error:",
          error
        );
      }
    }


    // ===================================================
    // DISPLAY TITLE
    //
    // Example:
    //
    // Sales | Ajira & Connection Hub TZ
    //
    // ICT Officer | Vodacom Tanzania PLC
    // ===================================================

    let displayTitle =
      jobTitle;


    if (
      companyName &&
      jobTitle
    ) {

      displayTitle =
        `${jobTitle} | ${companyName}`;
    }


    // ===================================================
    // CAPITALIZE FIRST LETTER
    //
    // "sales" -> "Sales"
    // ===================================================

    if (displayTitle) {

      displayTitle =
        displayTitle.charAt(0).toUpperCase() +
        displayTitle.slice(1);
    }


    // ===================================================
    // JOB IMAGE
    // ===================================================

    const image =
      job.featured_image_url ||
      job.company_logo_url ||
      companyLogo ||
      `${url.origin}/logo.png`;


    // ===================================================
    // WHATSAPP DESCRIPTION
    // ===================================================

    const descriptionParts = [];


    if (companyName) {

      descriptionParts.push(
        companyName
      );
    }


    if (location) {

      descriptionParts.push(
        location
      );
    }


    if (jobType) {

      descriptionParts.push(
        jobType
      );
    }


    let socialDescription =
      descriptionParts.join(" • ");


    if (previewDescription) {

      if (socialDescription) {

        socialDescription +=
          ` — ${previewDescription}`;

      } else {

        socialDescription =
          previewDescription;
      }
    }


    // ===================================================
    // CLEAN URL
    //
    // /job/my-job-slug
    // ===================================================

    const canonicalUrl =
      `${url.origin}/job/${encodeURIComponent(slug)}`;


    // ===================================================
    // GET THE ALREADY-STARTED JOB PAGE REQUEST
    // ===================================================

    const jobPageResponse = await jobPagePromise;


    // ===================================================
    // JOB PAGE ERROR
    // ===================================================

    if (!jobPageResponse.ok) {

      console.error(
        "job.html could not be loaded:",
        jobPageResponse.status
      );


      return new Response(
        "job.html haijapatikana.",
        {
          status: 404,

          headers: {
            "Content-Type":
              "text/plain; charset=UTF-8"
          }
        }
      );
    }


    let html =
      await jobPageResponse.text();


    // ===================================================
    // OPEN GRAPH METADATA
    // ===================================================

    const metaTags = `

<title>${escapeHtml(displayTitle)}</title>

<meta
  name="description"
  content="${escapeHtml(socialDescription)}"
>

<link
  rel="canonical"
  href="${escapeHtml(canonicalUrl)}"
>


<!-- OPEN GRAPH -->

<meta
  property="og:type"
  content="article"
>

<meta
  property="og:title"
  content="${escapeHtml(displayTitle)}"
>

<meta
  property="og:description"
  content="${escapeHtml(socialDescription)}"
>

<meta
  property="og:image"
  content="${escapeHtml(image)}"
>

<meta
  property="og:image:alt"
  content="${escapeHtml(displayTitle)}"
>

<meta
  property="og:url"
  content="${escapeHtml(canonicalUrl)}"
>

<meta
  property="og:site_name"
  content="Ajira & Connection Hub TZ"
>

<meta
  property="og:image:width"
  content="1200"
>

<meta
  property="og:image:height"
  content="630"
>


<!-- TWITTER -->

<meta
  name="twitter:card"
  content="summary_large_image"
>

<meta
  name="twitter:title"
  content="${escapeHtml(displayTitle)}"
>

<meta
  name="twitter:description"
  content="${escapeHtml(socialDescription)}"
>

<meta
  name="twitter:image"
  content="${escapeHtml(image)}"
>
`;


    // ===================================================
    // INSERT META TAGS
    // ===================================================

    if (
      html.includes("</head>")
    ) {

      html =
        html.replace(
          "</head>",
          `${metaTags}\n</head>`
        );
    }


    // ===================================================
    // RETURN PAGE
    // ===================================================

    return new Response(
      html,
      {
        status: 200,

        headers: {
          "Content-Type":
            "text/html; charset=UTF-8",

          "Cache-Control":
            "public, max-age=60, s-maxage=60"
        }
      }
    );


  } catch (error) {

    console.error(
      "JOB WORKER ERROR:",
      error
    );


    return serveJobPage(
      request,
      env
    );
  }
}


// =========================================================
// SERVE NORMAL JOB PAGE
// =========================================================

async function serveJobPage(
  request,
  env
) {

  const url =
    new URL(request.url);


  const jobUrl =
    new URL(
      "/job.html",
      url.origin
    );


  jobUrl.search =
    url.search;


  return env.ASSETS.fetch(
    new Request(
      jobUrl,
      {
        method: "GET",
        headers: request.headers
      }
    )
  );
}


// =========================================================
// CLEAN DESCRIPTION
// =========================================================

function cleanText(text) {

  return String(text || "")

    .replace(
      /<[^>]*>/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


// =========================================================
// SHORT DESCRIPTION
// =========================================================

function makePreviewDescription(
  text
) {

  if (!text) {

    return "Soma taarifa za nafasi hii na jinsi ya kuomba kupitia Ajira & Connection Hub TZ.";
  }


  if (text.length <= 160) {

    return text;
  }


  return (
    text.substring(0, 157) +
    "..."
  );
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHtml(
  value
) {

  return String(value || "")

    .replace(
      /&/g,
      "&amp;"
    )

    .replace(
      /"/g,
      "&quot;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );
}