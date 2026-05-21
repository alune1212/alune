import {
  type ExportLoginLogsApiV1AuditLoginLogsExportGetParams,
  type ExportOperationLogsApiV1AuditOperationLogsExportGetParams,
  getDownloadFileAttachmentApiV1FilesFileIdDownloadGetUrl,
  getExportLoginLogsApiV1AuditLoginLogsExportGetUrl,
  getExportOperationLogsApiV1AuditOperationLogsExportGetUrl,
  uploadFileAttachmentApiV1FilesUploadPost,
  type FileAttachmentPublic,
  type LoginLogPublic,
  type OperationLogPublic
} from "./generated/api";
import { getApiBaseUrl } from "./runtime-config";

export { configureApiClient } from "./runtime-config";
export type { FileAttachmentPublic, LoginLogPublic, OperationLogPublic };

export type ApiResponse<TData> = {
  success: boolean;
  data: TData;
  message: string;
  error: string | null;
};

export type ListParams = {
  q?: string;
  status?: string;
  startedAt?: string;
  endedAt?: string;
  page?: number;
  pageSize?: number;
};

async function parseError(response: Response, fallbackMessage: string): Promise<Error> {
  try {
    const body = (await response.json()) as { detail?: unknown };
    return new Error(typeof body.detail === "string" ? body.detail : fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

function bearerHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`
  };
}

function apiUrl(path: string): string {
  return `${getApiBaseUrl()}${path}`;
}

function toGeneratedOperationLogExportParams(
  params?: ListParams
): ExportOperationLogsApiV1AuditOperationLogsExportGetParams {
  return {
    q: params?.q,
    status:
      params?.status === "success" || params?.status === "failure" || params?.status === "error"
        ? params.status
        : undefined,
    started_at: params?.startedAt,
    ended_at: params?.endedAt
  };
}

function toGeneratedLoginLogExportParams(
  params?: ListParams
): ExportLoginLogsApiV1AuditLoginLogsExportGetParams {
  return {
    q: params?.q,
    status: params?.status === "success" || params?.status === "failure" ? params.status : undefined,
    started_at: params?.startedAt,
    ended_at: params?.endedAt
  };
}

export async function exportOperationLogs(token: string, params?: ListParams): Promise<Blob> {
  const response = await fetch(
    apiUrl(
      getExportOperationLogsApiV1AuditOperationLogsExportGetUrl(
        toGeneratedOperationLogExportParams(params)
      )
    ),
    {
      headers: bearerHeaders(token)
    }
  );

  if (!response.ok) {
    throw await parseError(response, "Failed to export operation logs");
  }

  return response.blob();
}

export async function exportLoginLogs(token: string, params?: ListParams): Promise<Blob> {
  const response = await fetch(
    apiUrl(
      getExportLoginLogsApiV1AuditLoginLogsExportGetUrl(toGeneratedLoginLogExportParams(params))
    ),
    {
      headers: bearerHeaders(token)
    }
  );

  if (!response.ok) {
    throw await parseError(response, "Failed to export login logs");
  }

  return response.blob();
}

export async function uploadFileAttachment(
  token: string,
  file: File
): Promise<ApiResponse<FileAttachmentPublic>> {
  const response = await uploadFileAttachmentApiV1FilesUploadPost(
    { upload: file },
    {
      headers: bearerHeaders(token)
    }
  );

  return response.data as ApiResponse<FileAttachmentPublic>;
}

export async function downloadFileAttachment(token: string, fileId: string): Promise<Blob> {
  const response = await fetch(apiUrl(getDownloadFileAttachmentApiV1FilesFileIdDownloadGetUrl(fileId)), {
    headers: bearerHeaders(token)
  });

  if (!response.ok) {
    throw await parseError(response, "Failed to download file");
  }

  return response.blob();
}
