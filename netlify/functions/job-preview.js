const SUPABASE_URL = "https://jvgvmnzekjkaakgqkoct.supabase.co";
const SUPABASE_KEY =
  "sb_publishable_5h9e4kX950OSHjhKvcGTDg_X8AILbMk";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

function absoluteUrl(origin, value) {
  if (!value) return "";

  try {
    return new URL(value, origin).href;
  } catch {
    return "";
  }
}

exports.handler = async (event) => {

  /*
   * =========================================
   * 1. PATA SLUG
   * =========================================
   *
   * Inasaidia URL zote mbili:
   *
   * /job/ict-officer-vodacom-tanzania-plc
   *
   * na:
   *
   * /job.html?slug=ict-officer-vodacom-tanzania-plc
   */

  const querySlug =
    event.queryStringParameters?.slug;

  let pathSlug = "";

  if (event.path) {

    const match =
      event.path.match(/\/job\/([^/?#]+)/);

    if (match) {
      pathSlug = decodeURIComponent(match[1]);
    }
  }

  const slug =
    querySlug || pathSlug;

  console.log("JOB SLUG:", slug);

  if (!slug) {

    return {
      statusCode: 400,

      headers: {
        "Content-Type":
          "text/html; charset=UTF-8"
      },

      body: `
<!DOCTYPE html>
<html lang="sw">
<head>
<meta charset="UTF-8">
<title>Job slug missing</title>
</head>

<body>

<h1>Job slug missing</h1>

<p>
Link ya job haijawa na slug.
</p>

</body>
</html>
`
    };
  }


  /*
   * =========================================
   * 2. SUPABASE QUERY
   * =========================================
   */

  const select = [
    "id",
    "title",
    "slug",
    "location",
    "job_type",
    "description",
    "requirements",
    "deadline",
    "apply_link",
    "company_logo_url",
    "featured_image_url",
    "status",
    "companies(name,logo_url)",
    "categories(name)"
  ].join(",");


  const params =
    new URLSearchParams();

  params.set(
    "select",
    select
  );

  params.set(
    "slug",
    `eq.${slug}`
  );

  params.set(
    "status",
    "eq.published"
  );

  params.set(
    "limit",
    "1"
  );


  const supabaseUrl =
    `${SUPABASE_URL}/rest/v1/jobs?${params.toString()}`;


  try {

    /*
     * =========================================
     * 3. FETCH JOB FROM SUPABASE
     * =========================================
     */

    const response =
      await fetch(
        supabaseUrl,
        {
          method: "GET",

          headers: {
            "apikey":
              SUPABASE_KEY,

            "Authorization":
              `Bearer ${SUPABASE_KEY}`,

            "Accept":
              "application/json"
          }
        }
      );


    if (!response.ok) {

      const errorText =
        await response.text();

      throw new Error(
        `Supabase HTTP ${response.status}: ${errorText}`
      );
    }


    const rows =
      await response.json();

    const job =
      rows?.[0];


    /*
     * =========================================
     * 4. JOB HAIPATIKANI
     * =========================================
     */

    if (!job) {

      return {

        statusCode: 404,

        headers: {
          "Content-Type":
            "text/html; charset=UTF-8"
        },

        body: `
<!DOCTYPE html>

<html lang="sw">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1">

<title>Job haijapatikana</title>

<style>

body {
  font-family: Arial, sans-serif;
  background: #f5f8fc;
  margin: 0;
  padding: 40px;
  color: #172033;
}

.box {
  max-width: 650px;
  margin: 60px auto;
  background: white;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
}

a {
  display: inline-block;
  margin-top: 20px;
  background: #0b65c2;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
}

</style>

</head>

<body>

<div class="box">

<h1>Job haijapatikana</h1>

<p>
Job hii haipo au haijachapishwa.
</p>

<p>
Slug:
<strong>
${esc(slug)}
</strong>
</p>

<a href="/">
Rudi Home
</a>

</div>

</body>

</html>
`
      };
    }


    /*
     * =========================================
     * 5. WEBSITE URL
     * =========================================
     */

    const host =
      event.headers?.["x-forwarded-host"] ||
      event.headers?.host ||
      "ajirahub12.netlify.app";


    const protocol =
      event.headers?.["x-forwarded-proto"] ||
      "https";


    const origin =
      `${protocol}://${host}`;


    /*
     * =========================================
     * 6. COMPANY
     * =========================================
     */

    const company =
      job.companies?.name ||
      "Ajira & Connection Hub TZ";


    /*
     * =========================================
     * 7. CATEGORY
     * =========================================
     */

    const category =
      job.categories?.name ||
      "Jobs";


    /*
     * =========================================
     * 8. CLEAN PUBLIC URL
     * =========================================
     */

    const publicUrl =
      `${origin}/job/${encodeURIComponent(job.slug)}`;


    /*
     * =========================================
     * 9. ACTUAL JOB DETAILS PAGE
     * =========================================
     */

    const detailsUrl =
      `${origin}/job.html?slug=${encodeURIComponent(job.slug)}`;


    /*
     * =========================================
     * 10. JOB IMAGE
     * =========================================
     *
     * Priority:
     *
     * featured_image_url
     * company_logo_url
     * companies.logo_url
     */

    const image =
      absoluteUrl(
        origin,

        job.featured_image_url ||
        job.company_logo_url ||
        job.companies?.logo_url
      );


    /*
     * =========================================
     * 11. TITLE
     * =========================================
     */

    const title =
      `${job.title} | ${company}`;


    /*
     * =========================================
     * 12. DESCRIPTION
     * =========================================
     */

    const description =
      `${company} • ` +
      `${job.location || "Tanzania"} • ` +
      `${job.job_type || "Full Time"}. ` +
      `Soma taarifa za nafasi hii na jinsi ya kuomba kupitia Ajira & Connection Hub TZ.`;


    /*
     * =========================================
     * 13. HTML
     * =========================================
     */

    const html = `
<!DOCTYPE html>

<html lang="sw">

<head>

<meta charset="UTF-8">

<meta
name="viewport"
content="width=device-width, initial-scale=1"
>


<!-- BASIC SEO -->

<title>
${esc(title)}
</title>


<meta
name="description"
content="${esc(description)}"
>


<link
rel="canonical"
href="${esc(publicUrl)}"
>


<!-- =====================================
     WHATSAPP / FACEBOOK
===================================== -->

<meta
property="og:type"
content="article"
>


<meta
property="og:site_name"
content="Ajira & Connection Hub TZ"
>


<meta
property="og:title"
content="${esc(title)}"
>


<meta
property="og:description"
content="${esc(description)}"
>


<meta
property="og:url"
content="${esc(publicUrl)}"
>


${
  image
    ? `
<meta
property="og:image"
content="${esc(image)}"
>

<meta
property="og:image:secure_url"
content="${esc(image)}"
>

<meta
property="og:image:type"
content="image/png"
>

<meta
property="og:image:width"
content="1200"
>

<meta
property="og:image:height"
content="630"
>

<meta
property="og:image:alt"
content="${esc(job.title)}"
>
`
    : ""
}


<!-- =====================================
     TWITTER
===================================== -->

<meta
name="twitter:card"
content="summary_large_image"
>


<meta
name="twitter:title"
content="${esc(title)}"
>


<meta
name="twitter:description"
content="${esc(description)}"
>


${
  image
    ? `
<meta
name="twitter:image"
content="${esc(image)}"
>
`
    : ""
}


<!-- =====================================
     PAGE STYLE
===================================== -->

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background:
    #f5f8fc;

  color:
    #172033;
}


main {

  max-width:
    760px;

  margin:
    60px auto;

  padding:
    30px;

  background:
    white;

  border-radius:
    18px;

  text-align:
    center;

  box-shadow:
    0 10px 35px
    rgba(0,0,0,.08);
}


.job-image {

  width:
    100%;

  max-height:
    360px;

  object-fit:
    contain;

  border-radius:
    14px;

  margin-bottom:
    20px;
}


h1 {

  font-size:
    28px;

  line-height:
    1.3;

  margin:
    10px 0 15px;
}


.company {

  font-size:
    18px;

  font-weight:
    bold;
}


.info {

  font-size:
    17px;

  line-height:
    1.7;
}


.button {

  display:
    inline-block;

  margin-top:
    20px;

  padding:
    13px 22px;

  background:
    #0b65c2;

  color:
    white;

  border-radius:
    9px;

  text-decoration:
    none;

  font-weight:
    bold;
}

</style>

</head>


<body>


<main>


${
  image
    ? `
<img
class="job-image"
src="${esc(image)}"
alt="${esc(job.title)}"
>
`
    : ""
}


<h1>

${esc(job.title)}

</h1>


<p class="company">

${esc(company)}

</p>


<p class="info">

📍
${esc(job.location || "Tanzania")}

&nbsp; • &nbsp;

💼
${esc(job.job_type || "Full Time")}

</p>


<p class="info">

📂
${esc(category)}

</p>


${
  job.deadline
    ? `
<p class="info">
⏰ Deadline:
${esc(job.deadline)}
</p>
`
    : ""
}


<a
class="button"
href="${esc(detailsUrl)}"
>

Fungua Job Details

</a>


</main>


<!-- =====================================
     REDIRECT USER TO REAL JOB PAGE
===================================== -->

<script>

setTimeout(function () {

  window.location.href =
    ${JSON.stringify(detailsUrl)};

}, 800);

</script>


</body>

</html>
`;


    /*
     * =========================================
     * 14. RETURN RESPONSE
     * =========================================
     */

    return {

      statusCode:
        200,

      headers: {

        "Content-Type":
          "text/html; charset=UTF-8",

        "Cache-Control":
          "public, max-age=60, s-maxage=300"
      },

      body:
        html
    };


  } catch (error) {

    console.error(
      "JOB PREVIEW ERROR:",
      error
    );


    return {

      statusCode:
        500,

      headers: {

        "Content-Type":
          "text/html; charset=UTF-8"
      },

      body: `
<!DOCTYPE html>

<html lang="sw">

<head>

<meta charset="UTF-8">

<title>Server Error</title>

</head>

<body>

<h1>
Server error
</h1>

<p>
Imeshindikana kupata taarifa za job.
</p>

</body>

</html>
`
    };

  }

};