import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilesPage } from "@/features/files/files-page";
import { mockAuthValue, paginatedResponse, renderWithQueryClient, successResponse } from "@/test-utils";
import {
  uploadFileAttachment,
  type FileAttachmentPublic
} from "@alune/api-client";
import { useGetFileAttachmentsApiV1FilesGet } from "@alune/api-client/generated";

vi.mock("@/features/auth/auth-provider", () => ({
  useAuth: () => mockAuthValue
}));

vi.mock("@alune/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@alune/api-client")>();
  return {
    ...actual,
    downloadFileAttachment: vi.fn(),
    uploadFileAttachment: vi.fn()
  };
});

vi.mock("@alune/api-client/generated", () => ({
  useGetFileAttachmentsApiV1FilesGet: vi.fn()
}));

const files: FileAttachmentPublic[] = [
  {
    id: "file-1",
    filename: "stored-report.txt",
    original_filename: "report.txt",
    content_type: "text/plain",
    size_bytes: 12,
    storage_path: "2026/05/stored-report.txt",
    checksum: null,
    uploaded_by_user_id: "user-1"
  }
];

describe("FilesPage", () => {
  beforeEach(() => {
    vi.mocked(useGetFileAttachmentsApiV1FilesGet).mockReturnValue({
      data: { status: 200, data: paginatedResponse(files) },
      isError: false
    } as ReturnType<typeof useGetFileAttachmentsApiV1FilesGet>);
    vi.mocked(uploadFileAttachment).mockResolvedValue(successResponse(files[0]!));
  });

  it("uploads the selected file", async () => {
    const user = userEvent.setup();
    const upload = new File(["hello"], "upload.txt", { type: "text/plain" });

    const { container } = renderWithQueryClient(<FilesPage />);

    await screen.findByText("report.txt");
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input!, upload);
    await user.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(uploadFileAttachment).toHaveBeenCalledWith("test-token", upload);
    });
  });
});
