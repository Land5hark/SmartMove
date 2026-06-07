import { describe, expect, it } from "vitest";
import { createBoxDraft, sanitizeBoxRecord } from "./box-model";

describe("box model", () => {
  it("creates a persisted draft with server fields and no base64 photo", () => {
    const box = createBoxDraft({
      id: "BOX-1",
      userId: "user-1",
      assignedRoom: "Kitchen",
      manualDescription: "plates and mugs",
      aiGeneratedTags: ["plates", "mugs"],
      photoUrl: "https://cdn.example.com/box.jpg",
      photoDataUrl: "data:image/jpeg;base64,abc",
    });

    expect(box).toMatchObject({
      id: "BOX-1",
      userId: "user-1",
      qrCodeValue: "BOX-1",
      assignedRoom: "Kitchen",
      manualDescription: "plates and mugs",
      aiGeneratedTags: ["plates", "mugs"],
      photoUrl: "https://cdn.example.com/box.jpg",
      items: [],
    });
    expect(box).not.toHaveProperty("photoDataUrl");
    expect(Date.parse(box.createdAt)).not.toBeNaN();
  });

  it("sanitizes partial Firestore data into a safe box record", () => {
    const box = sanitizeBoxRecord("BOX-2", {
      userId: "user-2",
      qrCodeValue: "",
      createdAt: "",
      aiGeneratedTags: ["books", 7],
      items: [{ id: "item-1", name: "lamp" }, { name: "missing id" }],
    });

    expect(box.id).toBe("BOX-2");
    expect(box.qrCodeValue).toBe("BOX-2");
    expect(box.aiGeneratedTags).toEqual(["books"]);
    expect(box.items).toEqual([{ id: "item-1", name: "lamp" }]);
  });
});
