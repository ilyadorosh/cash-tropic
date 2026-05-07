import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import {
  DEFAULT_MODELS,
  // OPENAI_BASE_URL,
  GROQ_BASE_URL,
  GEMINI_BASE_URL,
  ServiceProvider,
  SAMBANOVA_BASE_URL,
} from "../constant";
import { isModelAvailableInServer } from "../utils/model";
import { cloudflareAIGatewayUrl } from "../utils/cloudflare";
import { Redis } from "@upstash/redis";

import { db } from "@/app/lib/drizzle";
import { messages } from "@/app/lib/schema";
import { ChatMessage } from "../store";

const serverConfig = getServerSideConfig();
console.log("configserver: ", serverConfig);

function getRedis() {
  return Redis.fromEnv();
}

function serializeMessageContent(content: ChatMessage["content"]): string {
  return typeof content === "string" ? content : JSON.stringify(content);
}

async function persistLatestUserMessage({
  provider,
  model,
  latestUserMessage,
}: {
  provider: "groq" | "sambanova";
  model?: string;
  latestUserMessage?: ChatMessage;
}) {
  if (!latestUserMessage) return;

  const payload = {
    provider,
    model: model ?? "",
    role: latestUserMessage.role,
    content: serializeMessageContent(latestUserMessage.content),
    createdAt: new Date().toISOString(),
  };

  try {
    await db.insert(messages).values({ message: JSON.stringify(payload) });
  } catch (error) {
    console.error("[Chat Persistence] Failed to persist in DB:", {
      provider: payload.provider,
      model: payload.model,
      role: payload.role,
      error,
    });
  }

  try {
    const redis = getRedis();
    await redis
      .multi()
      .rpush("chat:messages", JSON.stringify(payload))
      .ltrim("chat:messages", -500, -1)
      .exec();
  } catch (error) {
    console.error("[Chat Persistence] Failed to persist in Redis:", {
      provider: payload.provider,
      model: payload.model,
      role: payload.role,
      error,
    });
  }
}

// export async function requestOpenai(req: NextRequest) {
//   const controller = new AbortController();

//   var authValue,
//     authHeaderName = "";
//   authValue = req.headers.get("Authorization") ?? "";
//   authHeaderName = "Authorization";

//   let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
//     "/api/openai/",
//     "",
//   );

//   // let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
//   //   "/api/groq/",
//   //   "",
//   // );

//   let baseUrl = OPENAI_BASE_URL;

//   if (!baseUrl.startsWith("http")) {
//     baseUrl = `https://${baseUrl}`;
//   }

//   if (baseUrl.endsWith("/")) {
//     baseUrl = baseUrl.slice(0, -1);
//   }

//   console.log("[Proxy] ", path);
//   console.log("[Base Url OpenAI?]", baseUrl);

//   const timeoutId = setTimeout(
//     () => {
//       controller.abort();
//     },
//     10 * 60 * 1000,
//   );

//   const fetchUrl = cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
//   console.log("fetchUrl", fetchUrl);
//   const fetchOptions: RequestInit = {
//     headers: {
//       "Content-Type": "application/json",
//       "Cache-Control": "no-store",
//       [authHeaderName]: authValue,
//       ...(serverConfig.openaiOrgId && {
//         "OpenAI-Organization": serverConfig.openaiOrgId,
//       }),
//     },
//     method: req.method,
//     body: req.body,
//     // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
//     redirect: "manual",
//     // @ts-ignore
//     duplex: "half",
//     signal: controller.signal,
//   };

//   // #1815 try to refuse gpt4 request
//   if (serverConfig.customModels && req.body) {
//     try {
//       const clonedBody = await req.text();
//       fetchOptions.body = clonedBody;

//       const jsonBody = JSON.parse(clonedBody) as { model?: string };

//       // not undefined and is false
//       if (
//         isModelAvailableInServer(
//           serverConfig.customModels,
//           jsonBody?.model as string,
//           ServiceProvider.OpenAI as string,
//         ) ||
//         isModelAvailableInServer(
//           serverConfig.customModels,
//           jsonBody?.model as string,
//           ServiceProvider.Azure as string,
//         )
//       ) {
//         return NextResponse.json(
//           {
//             error: true,
//             message: `you are not allowed to use ${jsonBody?.model} model`,
//           },
//           {
//             status: 403,
//           },
//         );
//       }
//     } catch (e) {
//       console.error("[OpenAI] gpt4 filter", e);
//     }
//   }

//   try {
//     const res = await fetch(fetchUrl, fetchOptions);

//     // Extract the OpenAI-Organization header from the response
//     const openaiOrganizationHeader = res.headers.get("OpenAI-Organization");

//     // Check if serverConfig.openaiOrgId is defined and not an empty string
//     if (serverConfig.openaiOrgId && serverConfig.openaiOrgId.trim() !== "") {
//       // If openaiOrganizationHeader is present, log it; otherwise, log that the header is not present
//       console.log("[Org ID]", openaiOrganizationHeader);
//     } else {
//       console.log("[Org ID] is not set up.");
//     }

//     // to prevent browser prompt for credentials
//     const newHeaders = new Headers(res.headers);
//     newHeaders.delete("www-authenticate");
//     // to disable nginx buffering
//     newHeaders.set("X-Accel-Buffering", "no");

//     // Conditionally delete the OpenAI-Organization header from the response if [Org ID] is undefined or empty (not setup in ENV)
//     // Also, this is to prevent the header from being sent to the client
//     if (!serverConfig.openaiOrgId || serverConfig.openaiOrgId.trim() === "") {
//       newHeaders.delete("OpenAI-Organization");
//     }

//     // The latest version of the OpenAI API forced the content-encoding to be "br" in json response
//     // So if the streaming is disabled, we need to remove the content-encoding header
//     // Because Vercel uses gzip to compress the response, if we don't remove the content-encoding header
//     // The browser will try to decode the response with brotli and fail
//     newHeaders.delete("content-encoding");

//     return new Response(res.body, {
//       status: res.status,
//       statusText: res.statusText,
//       headers: newHeaders,
//     });
//   } finally {
//     clearTimeout(timeoutId);
//   }
// }

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function requestGroq(req: NextRequest) {
  const controller = new AbortController();

  var authValue,
    authHeaderName = "";
  authValue = req.headers.get("Authorization") ?? "";
  authHeaderName = "Authorization";

  let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/groq/",
    "",
  );

  let baseUrl = serverConfig.baseUrl || GROQ_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy -  Groq] ", path);
  console.log("[Base Url -  Groq]", baseUrl);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const notclonedBody = await req
    .clone()
    .json()
    .catch(() => undefined);

  const fetchUrl = cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
  console.log("fetchUrl", fetchUrl);
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
      ...(serverConfig.openaiOrgId && {
        "OpenAI-Organization": serverConfig.openaiOrgId,
      }),
    },
    method: req.method,
    body: req.body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // #1815 try to refuse gpt4 request
  if (serverConfig.customModels && req.body) {
    try {
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;

      const jsonBody = JSON.parse(clonedBody) as { model?: string };

      // not undefined and is false
      if (
        isModelAvailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          ServiceProvider.OpenAI as string,
        ) ||
        isModelAvailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          ServiceProvider.Azure as string,
        )
      ) {
        return NextResponse.json(
          {
            error: true,
            message: `you are not allowed to use ${jsonBody?.model} model`,
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error("[OpenAI] gpt4 filter", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);
    // await kv.set('myresp', 'hi ' + textData);
    // await kv.set('mystate', 'hi '+req.clone().body.text());
    // const textData = await req.json()

    // await kv.set("mystate", notclonedBody);
    // await kv.lpush("mylist", notclonedBody);
    console.log("[sending this to Groq] ", notclonedBody);

    const filteredMessages = (notclonedBody?.messages ?? []).filter(
      (message: ChatMessage) => message.role === "user",
    );
    const latestUserMessage = filteredMessages.at(-1);
    console.log("[sending first message to Groq] ", latestUserMessage);
    await persistLatestUserMessage({
      provider: "groq",
      model: notclonedBody?.model,
      latestUserMessage,
    });

    // console.log ("[got this response from Groq] ", res.body);

    // Extract the OpenAI-Organization header from the response
    const openaiOrganizationHeader = res.headers.get("OpenAI-Organization");

    // Check if serverConfig.openaiOrgId is defined and not an empty string
    if (serverConfig.openaiOrgId && serverConfig.openaiOrgId.trim() !== "") {
      // If openaiOrganizationHeader is present, log it; otherwise, log that the header is not present
      console.log("[Org ID]", openaiOrganizationHeader);
    } else {
      console.log("[Org ID] is not set up.");
    }

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    // Conditionally delete the OpenAI-Organization header from the response if [Org ID] is undefined or empty (not setup in ENV)
    // Also, this is to prevent the header from being sent to the client
    if (!serverConfig.openaiOrgId || serverConfig.openaiOrgId.trim() === "") {
      newHeaders.delete("OpenAI-Organization");
    }

    // The latest version of the OpenAI API forced the content-encoding to be "br" in json response
    // So if the streaming is disabled, we need to remove the content-encoding header
    // Because Vercel uses gzip to compress the response, if we don't remove the content-encoding header
    // The browser will try to decode the response with brotli and fail
    newHeaders.delete("content-encoding");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestSambanova(req: NextRequest) {
  const controller = new AbortController();

  var authValue,
    authHeaderName = "";
  authValue = req.headers.get("Authorization") ?? "";
  authHeaderName = "Authorization";

  let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/sambanova/",
    "",
  );

  let baseUrl = serverConfig.baseUrl || SAMBANOVA_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  console.log("baseUrl: ", baseUrl);
  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy -  Sambanova] ", path);
  console.log("[Base Url -  Sambanova]", baseUrl);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const notclonedBody = await req
    .clone()
    .json()
    .catch(() => undefined);

  const fetchUrl = cloudflareAIGatewayUrl(`${baseUrl}/${path}`);
  console.log("fetchUrl", fetchUrl);
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
    },
    method: req.method,
    body: req.body,
    // to fix #2485: https://stackoverflow.com/questions/55920957/cloudflare-worker-typeerror-one-time-use-body
    redirect: "manual",
    // @ts-ignore
    duplex: "half",
    signal: controller.signal,
  };

  // #1815 try to refuse gpt4 request
  if (serverConfig.customModels && req.body) {
    try {
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;

      const jsonBody = JSON.parse(clonedBody) as { model?: string };

      // not undefined and is false
      if (
        isModelAvailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          ServiceProvider.OpenAI as string,
        ) ||
        isModelAvailableInServer(
          serverConfig.customModels,
          jsonBody?.model as string,
          ServiceProvider.Azure as string,
        )
      ) {
        return NextResponse.json(
          {
            error: true,
            message: `you are not allowed to use ${jsonBody?.model} model`,
          },
          {
            status: 403,
          },
        );
      }
    } catch (e) {
      console.error("[OpenAI] gpt4 filter", e);
    }
  }

  try {
    const res = await fetch(fetchUrl, fetchOptions);
    // await kv.set('myresp', 'hi ' + textData);
    // await kv.set('mystate', 'hi '+req.clone().body.text());
    // const textData = await req.json()

    // await kv.set("mystate", notclonedBody);
    // await kv.lpush("mylist", notclonedBody);
    console.log("[sending this to Sambanova] ", notclonedBody);

    const filteredMessages = (notclonedBody?.messages ?? []).filter(
      (message: ChatMessage) => message.role === "user",
    );
    const latestUserMessage = filteredMessages.at(-1);
    console.log("[sending first message to Sambanova] ", latestUserMessage);
    await persistLatestUserMessage({
      provider: "sambanova",
      model: notclonedBody?.model,
      latestUserMessage,
    });

    // to prevent browser prompt for credentials
    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    // to disable nginx buffering
    newHeaders.set("X-Accel-Buffering", "no");

    // The latest version of the OpenAI API forced the content-encoding to be "br" in json response
    // So if the streaming is disabled, we need to remove the content-encoding header
    // Because Vercel uses gzip to compress the response, if we don't remove the content-encoding header
    // The browser will try to decode the response with brotli and fail
    newHeaders.delete("content-encoding");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
