const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', () => {
      resolve(500);
    });
  });
}

async function test() {
  const baseUrl = "https://yt3.googleusercontent.com/ERb82ZTGZqAPPWZUHFf-AtfIKOIz_Cnyak3dPwgMM6tv2MdqyWBXr5cnrhZ6X8tpovGpU9L3Hqff_Q";
  const variations = [
    `${baseUrl}=w120-h120-l90-rj`, // original
    `${baseUrl}=w600-h600-l90-rj`,
    `${baseUrl}=w544-h544-l90-rj`,
    `${baseUrl}=w500-h500-l90-rj`,
    `${baseUrl}=s600-c-k-c0x00ffffff-no-rj`,
    `${baseUrl}=s544-c-k-c0x00ffffff-no-rj`,
    `${baseUrl}=s120-c`,
    `${baseUrl}=s500`
  ];

  for (const url of variations) {
    const code = await checkUrl(url);
    console.log(`URL: ${url}`);
    console.log(`Status code: ${code}\n`);
  }
}

test().catch(console.error);
