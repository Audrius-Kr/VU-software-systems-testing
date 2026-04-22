import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const prerequestSend = [
  "pm.collectionVariables.set('runId', String(Date.now()));",
  "const from = pm.environment.get('from_email');",
  "const to = pm.environment.get('to_email') || from;",
  "if (!from) { throw new Error('Set environment variable from_email'); }",
  "const runId = pm.collectionVariables.get('runId');",
  "const rfc2822 = 'From: <' + from + '>\r\nTo: <' + to + '>\r\nSubject: Test Email ' + runId + '\r\n\r\nHello world!';",
  "const utf8Bytes = unescape(encodeURIComponent(rfc2822));",
  "let bin = '';",
  "for (let i = 0; i < utf8Bytes.length; i++) { bin += String.fromCharCode(utf8Bytes.charCodeAt(i)); }",
  "const b64 = btoa(bin).split('+').join('-').split('/').join('_').replace(/=+$/, '');",
  "pm.environment.set('encoded_raw', b64);",
];

const testsSend = [
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "const json = pm.response.json();",
  "pm.test('response has non-empty message id', function () {",
  "  pm.expect(json).to.have.property('id');",
  "  pm.expect(json.id).to.be.a('string').that.is.not.empty;",
  "});",
  "pm.environment.set('message_id', json.id);",
];

const prerequestLabel = [
  "const runId = pm.collectionVariables.get('runId');",
  "pm.collectionVariables.set('label_name', 'auto-' + runId);",
];

const testsCreateLabel = [
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "const j = pm.response.json();",
  "pm.test('label id present', function () {",
  "  pm.expect(j).to.have.property('id');",
  "  pm.expect(j.id).to.be.a('string').that.is.not.empty;",
  "});",
  "pm.environment.set('label_id', j.id);",
];

const testsModify = [
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "const j = pm.response.json();",
  "const lid = pm.environment.get('label_id');",
  "pm.test('labelIds includes created label', function () {",
  "  pm.expect(j.labelIds || []).to.include(lid);",
  "});",
];

const testsList = [
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "const j = pm.response.json();",
  "const mid = pm.environment.get('message_id');",
  "pm.test('list includes sent message id', function () {",
  "  const ids = (j.messages || []).map(function (m) { return m.id; });",
  "  pm.expect(ids).to.include(mid);",
  "});",
];

const testsTrash = [
  "pm.test('HTTP 200', function () { pm.response.to.have.status(200); });",
  "const j = pm.response.json();",
  "pm.test('message has TRASH label', function () {",
  "  pm.expect(j.labelIds || []).to.include('TRASH');",
  "});",
];

const testsDeleteLabel = [
  "pm.test('HTTP 204', function () { pm.response.to.have.status(204); });",
  "pm.test('response time under 15s', function () {",
  "  pm.expect(pm.response.responseTime).to.be.below(15000);",
  "});",
];

function events(prerequest, test) {
  const ev = [];
  if (prerequest?.length) {
    ev.push({
      listen: "prerequest",
      script: { type: "text/javascript", exec: prerequest },
    });
  }
  if (test?.length) {
    ev.push({
      listen: "test",
      script: { type: "text/javascript", exec: test },
    });
  }
  return ev;
}

function req(name, method, pathExpr, bodyRaw, prerequest, test) {
  const url = "{{baseUrl}}/gmail/v1/users/{{userId}}/" + pathExpr;
  const r = {
    name,
    event: events(prerequest, test),
    request: {
      method,
      header: [],
      url,
    },
  };
  if (bodyRaw !== null && bodyRaw !== undefined) {
    r.request.header.push({
      key: "Content-Type",
      value: "application/json",
      type: "text",
    });
    r.request.body = {
      mode: "raw",
      raw: bodyRaw,
      options: { raw: { language: "json" } },
    };
  }
  return r;
}

const collection = {
  info: {
    name: "Gmail API (Postman + Newman)",
    description:
      "Exercise 1: Run **Exercise_1** — in Postman set OAuth 2.0 (Google) on the folder or collection, or set `access_token` in the environment for Newman.\n\nExercise 2: Run **Exercise_2** folder in order (preconditions → scenario → cleanup).",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{access_token}}", type: "string" }],
  },
  variable: [
    { key: "baseUrl", value: "https://gmail.googleapis.com", type: "string" },
    { key: "userId", value: "me", type: "string" },
  ],
  item: [
    {
      name: "Exercise_1",
      description:
        "**Task 1.1** In Postman: Authorization → OAuth 2.0 — Auth URL `https://accounts.google.com/o/oauth2/v2/auth`, Access Token URL `https://oauth2.googleapis.com/token`, scopes: `https://www.googleapis.com/auth/gmail.send` (add labels/modify scopes if you reuse this token for Exercise 2). Then **Get New Access Token** and **Use Token** (token is not stored in the exported file when using Bearer + env for Newman).\n\n**Task 1.2** Run **Send email** and check Test results.",
      item: [
        req(
          "Send email (Gmail API)",
          "POST",
          "messages/send",
          '{\n  "raw": "{{encoded_raw}}"\n}',
          prerequestSend,
          testsSend
        ),
      ],
    },
    {
      name: "Exercise_2",
      description:
        "Automated scenario: send → create label → modify message → list by label → **postconditions:** trash message, delete label. Uses **collection** variables (`baseUrl`, `userId`, `runId`, `label_name`) and **environment** variables (`access_token`, `from_email`, `message_id`, `label_id`).",
      item: [
        req(
          "01 Send email (precondition)",
          "POST",
          "messages/send",
          '{\n  "raw": "{{encoded_raw}}"\n}',
          prerequestSend,
          testsSend
        ),
        req(
          "02 Create label (precondition)",
          "POST",
          "labels",
          '{\n  "name": "{{label_name}}",\n  "labelListVisibility": "labelShow",\n  "messageListVisibility": "show"\n}',
          prerequestLabel,
          testsCreateLabel
        ),
        req(
          "03 Add label to message",
          "POST",
          "messages/{{message_id}}/modify",
          '{\n  "addLabelIds": ["{{label_id}}"]\n}',
          null,
          testsModify
        ),
        req(
          "04 List messages with label",
          "GET",
          "messages?labelIds={{label_id}}&maxResults=10",
          null,
          null,
          testsList
        ),
        req(
          "05 Trash message (cleanup)",
          "POST",
          "messages/{{message_id}}/trash",
          "{}",
          null,
          testsTrash
        ),
        req(
          "06 Delete label (cleanup)",
          "DELETE",
          "labels/{{label_id}}",
          null,
          null,
          testsDeleteLabel
        ),
      ],
    },
  ],
};

const out = join(root, "postman", "Gmail_API.postman_collection.json");
writeFileSync(out, JSON.stringify(collection, null, 2));
console.log("Wrote", out);
