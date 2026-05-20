// TODO: Migrate frontend call sites to the Orval-generated client exported as
// @alune/api-client/generated, then remove this compatibility layer.
import {
  createDepartmentApiV1DepartmentsPost,
  createDictionaryItemApiV1DictionariesItemsPost,
  createDictionaryTypeApiV1DictionariesTypesPost,
  createFileAttachmentApiV1FilesPost,
  createRoleApiV1RolesPost,
  createUserApiV1UsersPost,
  deleteDepartmentApiV1DepartmentsDepartmentIdDelete,
  deleteDictionaryItemApiV1DictionariesItemsItemIdDelete,
  deleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete,
  deleteRoleApiV1RolesRoleIdDelete,
  type ExportLoginLogsApiV1AuditLoginLogsExportGetParams,
  type ExportOperationLogsApiV1AuditOperationLogsExportGetParams,
  getDownloadFileAttachmentApiV1FilesFileIdDownloadGetUrl,
  getDepartmentTreeApiV1DepartmentsTreeGet,
  getDepartmentsApiV1DepartmentsGet,
  getDictionaryItemsApiV1DictionariesItemsGet,
  getDictionaryTypesApiV1DictionariesTypesGet,
  getExportLoginLogsApiV1AuditLoginLogsExportGetUrl,
  getExportOperationLogsApiV1AuditOperationLogsExportGetUrl,
  getFileAttachmentsApiV1FilesGet,
  getPermissionsApiV1RolesPermissionsGet,
  getRolePermissionsApiV1RolesRoleIdPermissionsGet,
  uploadFileAttachmentApiV1FilesUploadPost,
  getUserRolesApiV1UsersUserIdRolesGet,
  type GetLoginLogsApiV1AuditLoginLogsGetParams,
  type GetOperationLogsApiV1AuditOperationLogsGetParams,
  getLoginLogsApiV1AuditLoginLogsGet,
  getMeApiV1AuthMeGet,
  getOperationLogsApiV1AuditOperationLogsGet,
  getRolesApiV1RolesGet,
  getUsersApiV1UsersGet,
  healthCheckApiV1HealthGet,
  loginApiV1AuthLoginPost,
  updateDepartmentApiV1DepartmentsDepartmentIdPatch,
  updateDictionaryItemApiV1DictionariesItemsItemIdPatch,
  updateDictionaryTypeApiV1DictionariesTypesTypeIdPatch,
  updateRoleApiV1RolesRoleIdPatch,
  updateRolePermissionsApiV1RolesRoleIdPermissionsPut,
  updateUserApiV1UsersUserIdPatch,
  updateUserPasswordApiV1UsersUserIdPasswordPatch,
  updateUserRolesApiV1UsersUserIdRolesPut,
  updateUsersStatusApiV1UsersBulkStatusPatch
} from "./generated/api";
import { getApiBaseUrl } from "./runtime-config";
export { configureApiClient } from "./runtime-config";

export type ApiResponse<TData> = {
  success: boolean;
  data: TData;
  message: string;
  error: string | null;
};

export type Page<TItem> = {
  items: TItem[];
  page: number;
  page_size: number;
  total: number;
};

export type HealthStatus = {
  status: string;
  service: string;
};

export type Token = {
  access_token: string;
  token_type: "bearer";
};

export type UserPublic = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  department_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
  permissions: string[];
};

export type UserManagementItem = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
  department_id: string | null;
  is_active: boolean;
  is_superuser: boolean;
};

export type UserCreate = {
  username: string;
  email: string;
  full_name?: string | null;
  password: string;
  department_id?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserUpdate = {
  email?: string | null;
  full_name?: string | null;
  department_id?: string | null;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserBulkStatusUpdate = {
  user_ids: string[];
  is_active: boolean;
};

export type UserBulkStatusResult = {
  updated_count: number;
};

export type UserPasswordUpdate = {
  password: string;
};

export type UserRolePublic = {
  user_id: string;
  role_codes: string[];
};

export type RolePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type RoleCreate = {
  code: string;
  name: string;
  description?: string | null;
};

export type RoleUpdate = Partial<RoleCreate>;

export type PermissionPublic = {
  id: string;
  code: string;
  name: string;
  type: string;
  description: string | null;
};

export type RolePermissionPublic = {
  role_id: string;
  permission_codes: string[];
};

export type DepartmentPublic = {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type DepartmentTreeNode = DepartmentPublic & {
  children: DepartmentTreeNode[];
};

export type DepartmentCreate = {
  code: string;
  name: string;
  parent_id?: string | null;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type DepartmentUpdate = Partial<DepartmentCreate>;

export type OperationLogPublic = {
  id: string;
  actor_user_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  detail: string | null;
};

export type LoginLogPublic = {
  id: string;
  username: string;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: string;
  message: string | null;
};

export type DictionaryTypePublic = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
};

export type DictionaryItemPublic = {
  id: string;
  type_id: string;
  label: string;
  value: string;
  sort_order: number;
  is_active: boolean;
};

export type DictionaryTypeCreate = {
  code: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
};

export type DictionaryTypeUpdate = {
  code?: string;
  name?: string;
  description?: string | null;
};

export type DictionaryItemCreate = {
  type_id: string;
  label: string;
  value: string;
  sort_order?: number;
  is_active?: boolean;
};

export type DictionaryItemUpdate = {
  label?: string | null;
  value?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export type FileAttachmentPublic = {
  id: string;
  filename: string;
  original_filename: string;
  content_type: string | null;
  size_bytes: number;
  storage_path: string;
  checksum: string | null;
  uploaded_by_user_id: string | null;
};

export type FileAttachmentCreate = {
  filename: string;
  original_filename: string;
  content_type?: string | null;
  size_bytes: number;
  storage_path: string;
  checksum?: string | null;
};

export type ListParams = {
  q?: string;
  status?: string;
  departmentId?: string;
  roleCode?: string;
  startedAt?: string;
  endedAt?: string;
  page?: number;
  pageSize?: number;
};

export type LoginCredentials = {
  username: string;
  password: string;
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

function toGeneratedListParams(params?: ListParams) {
  return {
    q: params?.q,
    department_id: params?.departmentId,
    role_code: params?.roleCode,
    page: params?.page,
    page_size: params?.pageSize
  };
}

function toGeneratedAuditParams(params?: ListParams) {
  return {
    q: params?.q,
    started_at: params?.startedAt,
    ended_at: params?.endedAt,
    page: params?.page,
    page_size: params?.pageSize
  };
}

function toGeneratedOperationLogParams(params?: ListParams): GetOperationLogsApiV1AuditOperationLogsGetParams {
  return {
    ...toGeneratedAuditParams(params),
    status:
      params?.status === "success" || params?.status === "failure" || params?.status === "error"
        ? params.status
        : undefined
  };
}

function toGeneratedLoginLogParams(params?: ListParams): GetLoginLogsApiV1AuditLoginLogsGetParams {
  return {
    ...toGeneratedAuditParams(params),
    status: params?.status === "success" || params?.status === "failure" ? params.status : undefined
  };
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

function toGeneratedBasicListParams(params?: ListParams) {
  return {
    q: params?.q,
    page: params?.page,
    page_size: params?.pageSize
  };
}

export async function fetchHealthStatus(): Promise<ApiResponse<HealthStatus>> {
  const response = await healthCheckApiV1HealthGet();
  return response.data as ApiResponse<HealthStatus>;
}

export async function loginWithPassword(credentials: LoginCredentials): Promise<ApiResponse<Token>> {
  const response = await loginApiV1AuthLoginPost(credentials);
  return response.data as ApiResponse<Token>;
}

export async function fetchCurrentUser(token: string): Promise<ApiResponse<UserPublic>> {
  const response = await getMeApiV1AuthMeGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserPublic>;
}

export async function fetchUsers(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<UserManagementItem>>> {
  const response = await getUsersApiV1UsersGet(toGeneratedListParams(params), {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<Page<UserManagementItem>>;
}

export async function createUser(
  token: string,
  payload: UserCreate
): Promise<ApiResponse<UserManagementItem>> {
  const response = await createUserApiV1UsersPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserManagementItem>;
}

export async function updateUser(
  token: string,
  userId: string,
  payload: UserUpdate
): Promise<ApiResponse<UserManagementItem>> {
  const response = await updateUserApiV1UsersUserIdPatch(userId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserManagementItem>;
}

export async function updateUsersStatus(
  token: string,
  payload: UserBulkStatusUpdate
): Promise<ApiResponse<UserBulkStatusResult>> {
  const response = await updateUsersStatusApiV1UsersBulkStatusPatch(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserBulkStatusResult>;
}

export async function updateUserPassword(
  token: string,
  userId: string,
  payload: UserPasswordUpdate
): Promise<ApiResponse<UserManagementItem>> {
  const response = await updateUserPasswordApiV1UsersUserIdPasswordPatch(userId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserManagementItem>;
}

export async function fetchUserRoles(
  token: string,
  userId: string
): Promise<ApiResponse<UserRolePublic>> {
  const response = await getUserRolesApiV1UsersUserIdRolesGet(userId, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<UserRolePublic>;
}

export async function updateUserRoles(
  token: string,
  userId: string,
  roleCodes: string[]
): Promise<ApiResponse<UserRolePublic>> {
  const response = await updateUserRolesApiV1UsersUserIdRolesPut(
    userId,
    { role_codes: roleCodes },
    {
      headers: bearerHeaders(token)
    }
  );

  return response.data as ApiResponse<UserRolePublic>;
}

export async function fetchRoles(token: string): Promise<ApiResponse<RolePublic[]>> {
  const response = await getRolesApiV1RolesGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<RolePublic[]>;
}

export async function createRole(
  token: string,
  payload: RoleCreate
): Promise<ApiResponse<RolePublic>> {
  const response = await createRoleApiV1RolesPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<RolePublic>;
}

export async function updateRole(
  token: string,
  roleId: string,
  payload: RoleUpdate
): Promise<ApiResponse<RolePublic>> {
  const response = await updateRoleApiV1RolesRoleIdPatch(roleId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<RolePublic>;
}

export async function deleteRole(token: string, roleId: string): Promise<void> {
  await deleteRoleApiV1RolesRoleIdDelete(roleId, {
    headers: bearerHeaders(token)
  });
}

export async function fetchPermissions(token: string): Promise<ApiResponse<PermissionPublic[]>> {
  const response = await getPermissionsApiV1RolesPermissionsGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<PermissionPublic[]>;
}

export async function fetchRolePermissions(
  token: string,
  roleId: string
): Promise<ApiResponse<RolePermissionPublic>> {
  const response = await getRolePermissionsApiV1RolesRoleIdPermissionsGet(roleId, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<RolePermissionPublic>;
}

export async function updateRolePermissions(
  token: string,
  roleId: string,
  permissionCodes: string[]
): Promise<ApiResponse<RolePermissionPublic>> {
  const response = await updateRolePermissionsApiV1RolesRoleIdPermissionsPut(
    roleId,
    { permission_codes: permissionCodes },
    {
      headers: bearerHeaders(token)
    }
  );

  return response.data as ApiResponse<RolePermissionPublic>;
}

export async function fetchDepartments(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<DepartmentPublic>>> {
  const response = await getDepartmentsApiV1DepartmentsGet(toGeneratedListParams(params), {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<Page<DepartmentPublic>>;
}

export async function fetchDepartmentTree(token: string): Promise<ApiResponse<DepartmentTreeNode[]>> {
  const response = await getDepartmentTreeApiV1DepartmentsTreeGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DepartmentTreeNode[]>;
}

export async function createDepartment(
  token: string,
  payload: DepartmentCreate
): Promise<ApiResponse<DepartmentPublic>> {
  const response = await createDepartmentApiV1DepartmentsPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DepartmentPublic>;
}

export async function updateDepartment(
  token: string,
  departmentId: string,
  payload: DepartmentUpdate
): Promise<ApiResponse<DepartmentPublic>> {
  const response = await updateDepartmentApiV1DepartmentsDepartmentIdPatch(departmentId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DepartmentPublic>;
}

export async function deleteDepartment(token: string, departmentId: string): Promise<void> {
  await deleteDepartmentApiV1DepartmentsDepartmentIdDelete(departmentId, {
    headers: bearerHeaders(token)
  });
}

export async function fetchOperationLogs(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<OperationLogPublic>>> {
  const response = await getOperationLogsApiV1AuditOperationLogsGet(toGeneratedOperationLogParams(params), {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<Page<OperationLogPublic>>;
}

export async function fetchLoginLogs(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<LoginLogPublic>>> {
  const response = await getLoginLogsApiV1AuditLoginLogsGet(toGeneratedLoginLogParams(params), {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<Page<LoginLogPublic>>;
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

export async function fetchDictionaryTypes(token: string): Promise<ApiResponse<DictionaryTypePublic[]>> {
  const response = await getDictionaryTypesApiV1DictionariesTypesGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryTypePublic[]>;
}

export async function createDictionaryType(
  token: string,
  payload: DictionaryTypeCreate
): Promise<ApiResponse<DictionaryTypePublic>> {
  const response = await createDictionaryTypeApiV1DictionariesTypesPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryTypePublic>;
}

export async function updateDictionaryType(
  token: string,
  typeId: string,
  payload: DictionaryTypeUpdate
): Promise<ApiResponse<DictionaryTypePublic>> {
  const response = await updateDictionaryTypeApiV1DictionariesTypesTypeIdPatch(typeId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryTypePublic>;
}

export async function deleteDictionaryType(token: string, typeId: string): Promise<void> {
  await deleteDictionaryTypeApiV1DictionariesTypesTypeIdDelete(typeId, {
    headers: bearerHeaders(token)
  });
}

export async function fetchDictionaryItems(token: string): Promise<ApiResponse<DictionaryItemPublic[]>> {
  const response = await getDictionaryItemsApiV1DictionariesItemsGet({
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryItemPublic[]>;
}

export async function createDictionaryItem(
  token: string,
  payload: DictionaryItemCreate
): Promise<ApiResponse<DictionaryItemPublic>> {
  const response = await createDictionaryItemApiV1DictionariesItemsPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryItemPublic>;
}

export async function updateDictionaryItem(
  token: string,
  itemId: string,
  payload: DictionaryItemUpdate
): Promise<ApiResponse<DictionaryItemPublic>> {
  const response = await updateDictionaryItemApiV1DictionariesItemsItemIdPatch(itemId, payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<DictionaryItemPublic>;
}

export async function deleteDictionaryItem(token: string, itemId: string): Promise<void> {
  await deleteDictionaryItemApiV1DictionariesItemsItemIdDelete(itemId, {
    headers: bearerHeaders(token)
  });
}

export async function fetchFileAttachments(
  token: string,
  params?: ListParams
): Promise<ApiResponse<Page<FileAttachmentPublic>>> {
  const response = await getFileAttachmentsApiV1FilesGet(toGeneratedBasicListParams(params), {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<Page<FileAttachmentPublic>>;
}

export async function createFileAttachment(
  token: string,
  payload: FileAttachmentCreate
): Promise<ApiResponse<FileAttachmentPublic>> {
  const response = await createFileAttachmentApiV1FilesPost(payload, {
    headers: bearerHeaders(token)
  });

  return response.data as ApiResponse<FileAttachmentPublic>;
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
