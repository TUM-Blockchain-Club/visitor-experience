import axios from "axios";
import fs from "node:fs";
import path from "node:path";

import { Session } from "@/lib/model/session";
import { Speaker } from "@/lib/model/speaker";

const STRAPI_BASE_URL =
  process.env.STRAPI_BASE_URL ?? "https://strapi.rbg.tum-blockchain.com";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN ?? "";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const SPEAKERS_DIR = path.join(PUBLIC_DIR, "speakers");
const SESSIONS_JSON_PATH = path.join(PUBLIC_DIR, "sessions.json");
const SPEAKERS_JSON_PATH = path.join(PUBLIC_DIR, "speakers.json");

function ensureDirectoryExistsSync(directoryPath: string): void {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildStrapiUrl(relativeOrAbsolute: string): string {
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  return `${STRAPI_BASE_URL}${relativeOrAbsolute}`;
}

async function fetchSessionsFromStrapi(): Promise<Session[]> {
  if (!STRAPI_API_TOKEN) {
    console.warn("STRAPI_API_TOKEN missing; returning empty sessions list");
    return [];
  }

  const sessions: Session[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await axios.get(
        `${STRAPI_BASE_URL}/api/agenda-25s?sort=startTime:asc&pagination[page]=${page}&pagination[pageSize]=50`,
        { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
      );

      const pageData: Session[] = res.data.data ?? [];
      sessions.push(...pageData);

      const pagination = res.data?.meta?.pagination;
      hasMore = Boolean(pagination && pagination.page < pagination.pageCount);
      page += 1;
    } catch (error) {
      console.error("Error fetching sessions from Strapi:", error);
      break;
    }
  }

  return sessions;
}

async function downloadProfilePictureToPublic(speaker: Speaker): Promise<void> {
  if (!speaker.profile_photo || !speaker.profile_photo.url) {
    console.warn(`No profile photo for speaker: ${speaker.name}`);
    return;
  }

  ensureDirectoryExistsSync(SPEAKERS_DIR);

  const ext = speaker.profile_photo.ext || ".webp";
  const fileName = `${speaker.documentId}${ext}`;
  const filePath = path.join(SPEAKERS_DIR, fileName);

  if (fs.existsSync(filePath)) {
    speaker.profile_photo.url = `/speakers/${fileName}`;
    return;
  }

  try {
    const url = buildStrapiUrl(speaker.profile_photo.url);
    const res = await axios({ url, method: "GET", responseType: "stream" });

    const writer = fs.createWriteStream(filePath);
    res.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on("finish", () => resolve());
      writer.on("error", (err) => reject(err));
    });

    speaker.profile_photo.url = `/speakers/${fileName}`;
  } catch (error) {
    console.error(
      `Error downloading profile picture for ${speaker.name}:`,
      error
    );
  }
}

async function fetchSpeakersFromStrapi(): Promise<Speaker[]> {
  if (!STRAPI_API_TOKEN) {
    console.warn("STRAPI_API_TOKEN missing; returning empty speakers list");
    return [];
  }

  const speakers: Speaker[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      const res = await axios.get(
        `${STRAPI_BASE_URL}/api/speakers25?sort=name:asc&pagination[page]=${page}&pagination[pageSize]=50&populate=profile_photo`,
        { headers: { Authorization: `Bearer ${STRAPI_API_TOKEN}` } }
      );

      const pageData: Speaker[] = res.data.data ?? [];
      for (const speaker of pageData) {
        await downloadProfilePictureToPublic(speaker);
        await delay(250);
      }

      speakers.push(...pageData);

      const pagination = res.data?.meta?.pagination;
      hasMore = Boolean(pagination && pagination.page < pagination.pageCount);
      page += 1;
    } catch (error) {
      console.error("Error fetching speakers from Strapi:", error);
      break;
    }
  }

  return speakers;
}

async function writeJsonCache(filePath: string, data: unknown): Promise<void> {
  ensureDirectoryExistsSync(path.dirname(filePath));
  await fs.promises.writeFile(
    filePath,
    JSON.stringify(data, null, 2),
    { encoding: "utf8" }
  );
}

export async function refreshStrapiCache(): Promise<{ sessionsCount: number; speakersCount: number; }> {
  ensureDirectoryExistsSync(PUBLIC_DIR);
  ensureDirectoryExistsSync(SPEAKERS_DIR);

  const [sessions, speakers] = await Promise.all([
    fetchSessionsFromStrapi(),
    fetchSpeakersFromStrapi(),
  ]);

  await Promise.all([
    writeJsonCache(SESSIONS_JSON_PATH, sessions),
    writeJsonCache(SPEAKERS_JSON_PATH, speakers),
  ]);

  return { sessionsCount: sessions.length, speakersCount: speakers.length };
}

export type RefreshSummary = Awaited<ReturnType<typeof refreshStrapiCache>>;


