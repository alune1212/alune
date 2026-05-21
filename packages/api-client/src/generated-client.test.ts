import { afterEach, describe, expect, it, vi } from "vitest";

import {
  configureApiClient,
  downloadFileAttachment,
  exportLoginLogs,
  exportOperationLogs,
  uploadFileAttachment
} from "./index";
import { healthCheckApiV1HealthGet } from "./generated/api";
import type { BodyUploadFileAttachmentApiV1FilesUploadPost } from "./generated/api";

describe("generated API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    configureApiClient({});
  });

  it("uses the configured API base URL for generated requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: "ok", service: "api" },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    const response = await healthCheckApiV1HealthGet();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/health", {
      method: "GET"
    });
    expect(response.data.data.status).toBe("ok");
  });

  it("uses the runtime configured API base URL", async () => {
    configureApiClient({ baseUrl: "http://localhost:18000/" });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { status: "ok", service: "api" },
          message: "OK",
          error: null
        }),
        { status: 200 }
      )
    );

    await healthCheckApiV1HealthGet();

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:18000/api/v1/health", {
      method: "GET"
    });
  });

  it("exports audit logs using generated URL parameter mapping", async () => {
    const csvBlob = new Blob(["id,action\n"], { type: "text/csv" });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(csvBlob, {
          status: 200,
          headers: { "Content-Type": "text/csv" }
        })
      )
      .mockResolvedValueOnce(
        new Response(csvBlob, {
          status: 200,
          headers: { "Content-Type": "text/csv" }
        })
      );

    await exportOperationLogs("token-value", {
      q: "login",
      status: "success",
      startedAt: "2026-01-01T00:00:00",
      endedAt: "2026-01-31T23:59:59",
      page: 3,
      pageSize: 15
    });
    await exportLoginLogs("token-value", {
      q: "admin",
      status: "failure",
      page: 1,
      pageSize: 10
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:8000/api/v1/audit/operation-logs/export?q=login&status=success&started_at=2026-01-01T00%3A00%3A00&ended_at=2026-01-31T23%3A59%3A59",
      {
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/api/v1/audit/login-logs/export?q=admin&status=failure",
      {
        headers: {
          Authorization: "Bearer token-value"
        }
      }
    );
  });

  it("uploads files through the generated multipart request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: "file-1", filename: "stored.pdf", original_filename: "contract.pdf" },
          message: "OK",
          error: null
        }),
        { status: 201 }
      )
    );
    const file = new File(["content"], "contract.pdf", { type: "application/pdf" });
    const uploadBody: BodyUploadFileAttachmentApiV1FilesUploadPost = { upload: file };

    const response = await uploadFileAttachment("token-value", uploadBody.upload as File);

    const [, options] = fetchMock.mock.calls[0]!;
    expect(fetchMock.mock.calls[0]?.[0]).toBe("http://localhost:8000/api/v1/files/upload");
    expect(options?.method).toBe("POST");
    expect(options?.headers).toEqual({ Authorization: "Bearer token-value" });
    expect(options?.body).toBeInstanceOf(FormData);
    expect((options?.body as FormData).get("upload")).toBe(file);
    expect(response.data.id).toBe("file-1");
  });

  it("downloads files using the generated URL helper", async () => {
    const fileBlob = new Blob(["content"], { type: "application/pdf" });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(fileBlob, { status: 200 }));

    const response = await downloadFileAttachment("token-value", "file-1");

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/api/v1/files/file-1/download", {
      headers: {
        Authorization: "Bearer token-value"
      }
    });
    expect(response.size).toBe(fileBlob.size);
  });
});
