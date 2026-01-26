import Conf from "conf";

export interface ClipItem {
  id: number;
  content: string;
  timestamp: number;
  preview: string;
}

interface StorageSchema {
  clips: ClipItem[];
  nextId: number;
  maxItems: number;
}

const config = new Conf<StorageSchema>({
  projectName: "pinch",
  defaults: {
    clips: [],
    nextId: 1,
    maxItems: 100,
  },
});

export function getClips(): ClipItem[] {
  return config.get("clips");
}

export function addClip(content: string): ClipItem | null {
  const clips = getClips();
  
  // Don't add duplicates of the most recent item
  if (clips.length > 0 && clips[0].content === content) {
    return null;
  }
  
  // Don't add empty content
  if (!content || content.trim().length === 0) {
    return null;
  }
  
  const maxItems = config.get("maxItems");
  const nextId = config.get("nextId");
  
  const preview = content.length > 80 
    ? content.substring(0, 77) + "..." 
    : content;
  
  const newClip: ClipItem = {
    id: nextId,
    content,
    timestamp: Date.now(),
    preview: preview.replace(/\n/g, "↵").replace(/\t/g, "→"),
  };
  
  // Add to front
  clips.unshift(newClip);
  
  // Trim if over limit
  if (clips.length > maxItems) {
    clips.pop();
  }
  
  config.set("clips", clips);
  config.set("nextId", nextId + 1);
  
  return newClip;
}

export function getClipById(id: number): ClipItem | undefined {
  return getClips().find((c) => c.id === id);
}

export function getClipByIndex(index: number): ClipItem | undefined {
  const clips = getClips();
  if (index < 0 || index >= clips.length) return undefined;
  return clips[index];
}

export function clearClips(): void {
  config.set("clips", []);
}

export function deleteClip(id: number): boolean {
  const clips = getClips();
  const index = clips.findIndex((c) => c.id === id);
  if (index === -1) return false;
  clips.splice(index, 1);
  config.set("clips", clips);
  return true;
}

export function searchClips(query: string): ClipItem[] {
  const clips = getClips();
  const lowerQuery = query.toLowerCase();
  return clips.filter((c) => c.content.toLowerCase().includes(lowerQuery));
}

export function getMaxItems(): number {
  return config.get("maxItems");
}

export function setMaxItems(max: number): void {
  config.set("maxItems", max);
  // Trim existing clips if necessary
  const clips = getClips();
  if (clips.length > max) {
    config.set("clips", clips.slice(0, max));
  }
}
