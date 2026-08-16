# Quote form backend — Google Sheet + email, 10-minute setup

The "Get Accurate Quote" dialog POSTs to a **Google Apps Script Web App** that
appends a row to a Google Sheet, saves any uploaded files to Drive, and emails
the company address. No servers, no subscriptions, owned by the company
account. Do this once the company Google account exists.

## 1. Create the sheet

Signed in as the **company Google account**:

1. Create a Google Sheet named e.g. `Nalar — Quote Requests`.
2. Rename the first tab to `Quotes`.
3. Add a header row:
   `Received | Email | Name | Company | Description | Links | Files | Calculator`

## 2. Add the script

In the sheet: **Extensions → Apps Script**, delete the placeholder, paste:

```js
const SHEET_NAME = "Quotes";
const NOTIFY_EMAIL = "CHANGE-ME@nalarlabs.com"; // the company address
const UPLOAD_FOLDER = "Quote Uploads";

function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // Save uploads to Drive, collect share links.
  const fileLinks = (data.files || []).map((f) => {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(f.base64), f.type || "application/octet-stream", f.name
    );
    return getUploadFolder_().createFile(blob).getUrl();
  });

  // One row per request.
  SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME).appendRow([
    new Date(),
    data.email,
    data.name,
    data.company,
    data.description,
    (data.links || []).join("\n"),
    fileLinks.join("\n"),
    JSON.stringify(data.roi),
  ]);

  // Notify the inbox.
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "New quote request — " + (data.email || "unknown"),
    body: [
      "From: " + data.email + (data.name ? " (" + data.name + ")" : ""),
      "Company: " + (data.company || "—"),
      "",
      data.description,
      "",
      "Links:\n" + ((data.links || []).join("\n") || "—"),
      "Files:\n" + (fileLinks.join("\n") || "—"),
      "",
      "Calculator snapshot:\n" + JSON.stringify(data.roi, null, 2),
    ].join("\n"),
  });

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getUploadFolder_() {
  const existing = DriveApp.getFoldersByName(UPLOAD_FOLDER);
  return existing.hasNext() ? existing.next() : DriveApp.createFolder(UPLOAD_FOLDER);
}
```

Set `NOTIFY_EMAIL` to the real company address.

## 3. Deploy

1. **Deploy → New deployment → Web app.**
2. *Execute as*: **Me** (the company account).
3. *Who has access*: **Anyone** — required so the anonymous landing page can
   POST. The URL is unguessable; the script only appends and emails.
4. Authorize the permission prompts (Sheets, Drive, Mail).
5. Copy the **Web app URL** (ends in `/exec`).

## 4. Wire the frontend

Paste the URL into [`src/app/data/quote.ts`](../src/app/data/quote.ts):

```ts
export const QUOTE_ENDPOINT = "https://script.google.com/macros/s/…/exec";
```

Until this is done the dialog validates and previews normally but submission
shows "the quote inbox isn't connected yet" and logs the payload to the console.

## 5. Verify end-to-end

Submit a test request with a small file: the sheet gains a row, the file lands
in `Quote Uploads`, and the email arrives. Then tick the boxes in the PRD
([`docs/PRDs/2026-08-16_accurate-quote-form_PENDING.md`](PRDs/2026-08-16_accurate-quote-form_PENDING.md) §6).

## Notes

- The browser POSTs `text/plain` to avoid a CORS preflight (Apps Script cannot
  answer `OPTIONS`). The JSON is parsed from `e.postData.contents`.
- Frontend caps uploads at 5 MB/file, 10 MB total — well inside Apps Script's
  POST limits.
- **Re-deploying** the script creates a *new* URL unless you choose
  "Manage deployments → edit the existing one". Keep the URL stable, or update
  `QUOTE_ENDPOINT` after every deploy.
