const API_BASE = 'http://localhost:5001/api/v1';

// Helper for fetch with error handling and fallback
async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.message || errBody.error || `HTTP error ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Failed to call ${endpoint}:`, err.message);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: () => request('/../../health'),

  // Bookings (Job Orders)
  getBookings: () => request('/bookings'),
  createBooking: (bookingData) =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    }),
  updateDocumentation: (jobId, docData) =>
    request(`/bookings/${jobId}/documentation`, {
      method: 'PUT',
      body: JSON.stringify(docData)
    }),

  // Operations
  getTripPendency: () => request('/operations/trip-pendency'),
  generateGR: (payload) =>
    request('/operations/generate-gr', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  advanceMilestone: (payload) =>
    request('/operations/advance-milestone', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateDocs: (payload) =>
    request('/operations/update-docs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Masters
  getCustomers: () => request('/masters/customers'),
  createCustomer: (data) =>
    request('/masters/customers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCustomer: (id, data) =>
    request(`/masters/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCustomer: (id) =>
    request(`/masters/customers/${id}`, {
      method: 'DELETE'
    }),

  getDrivers: () => request('/masters/drivers'),
  createDriver: (data) =>
    request('/masters/drivers', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateDriver: (id, data) =>
    request(`/masters/drivers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteDriver: (id) =>
    request(`/masters/drivers/${id}`, {
      method: 'DELETE'
    }),

  getVehicles: () => request('/masters/vehicles'),
  createVehicle: (data) =>
    request('/masters/vehicles', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateVehicle: (id, data) =>
    request(`/masters/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteVehicle: (id) =>
    request(`/masters/vehicles/${id}`, {
      method: 'DELETE'
    }),

  getPorts: () => request('/masters/ports'),
  createPort: (data) =>
    request('/masters/ports', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updatePort: (id, data) =>
    request(`/masters/ports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deletePort: (id) =>
    request(`/masters/ports/${id}`, {
      method: 'DELETE'
    }),

  getCompany: () => request('/masters/company'),
  updateCompany: (data) =>
    request('/masters/company', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  getServices: () => request('/masters/services'),

  // Commercial Invoices & Notes
  getInvoices: () => request('/commercial/invoices'),
  createInvoice: (data) =>
    request('/commercial/invoices', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getNotes: () => request('/commercial/notes'),
  createNote: (data) =>
    request('/commercial/notes', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getCommercialReports: () => request('/commercial/reports'),

  // Empty Management
  getEmptyInventory: () => request('/empty/inventory'),
  getEmptyOrders: () => request('/empty/orders'),

  // 34-Page Master Extensions
  getTaxHeadGroups: () => request('/masters/tax-head-groups'),
  createTaxHeadGroup: (data) => request('/masters/tax-head-groups', { method: 'POST', body: JSON.stringify(data) }),
  getTaxHeads: () => request('/masters/tax-heads'),
  createTaxHead: (data) => request('/masters/tax-heads', { method: 'POST', body: JSON.stringify(data) }),
  getServiceMaster: () => request('/masters/service-master'),
  createServiceMaster: (data) => request('/masters/service-master', { method: 'POST', body: JSON.stringify(data) }),
  getTerminals: () => request('/masters/terminals'),
  createTerminal: (data) => request('/masters/terminals', { method: 'POST', body: JSON.stringify(data) }),
  getUOMs: () => request('/masters/uom'),
  createUOM: (data) => request('/masters/uom', { method: 'POST', body: JSON.stringify(data) }),
  getCommodities: () => request('/masters/commodities'),
  createCommodity: (data) => request('/masters/commodities', { method: 'POST', body: JSON.stringify(data) }),
  getBanks: () => request('/masters/banks'),
  createBank: (data) => request('/masters/banks', { method: 'POST', body: JSON.stringify(data) }),
  getTariffs: () => request('/masters/tariffs'),
  createTariff: (data) => request('/masters/tariffs', { method: 'POST', body: JSON.stringify(data) }),
  approveTariff: (id, data) => request(`/masters/tariffs/${id}/approve`, { method: 'PUT', body: JSON.stringify(data) }),

  // 34-Page Lifecycle Operations
  updateRunningPosition: (payload) => request('/operations/running-position', { method: 'POST', body: JSON.stringify(payload) }),
  updateTripClose: (payload) => request('/operations/trip-close', { method: 'POST', body: JSON.stringify(payload) }),
  updateEdi: (payload) => request('/operations/edi-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateRailOut: (payload) => request('/operations/rail-out', { method: 'POST', body: JSON.stringify(payload) }),
  updateVesselPlan: (payload) => request('/operations/vessel-plan', { method: 'POST', body: JSON.stringify(payload) }),
  updateSob: (payload) => request('/operations/sob-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateBlStatus: (payload) => request('/operations/bl-status', { method: 'POST', body: JSON.stringify(payload) }),
  updateTelex: (payload) => request('/operations/telex-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateTr: (payload) => request('/operations/tr-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateHandover: (payload) => request('/operations/handover-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateEgm: (payload) => request('/operations/egm-update', { method: 'POST', body: JSON.stringify(payload) }),
  updateDischargeStatus: (payload) => request('/operations/discharge-status', { method: 'POST', body: JSON.stringify(payload) }),
  createEmptyOrder: (data) =>
    request('/empty/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
