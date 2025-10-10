import React, { useState, useEffect, useMemo } from 'react';
import { authAPI } from '../../services/authAPI';
import './StaffSelectionPopup.css';

export default function StaffSelectionPopup({
  isOpen,
  onClose,
  stationId,
  stationName,
  onStaffAdded,
  assignedStaffIds = []
}) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const assignedIdsSet = useMemo(() => {
    const incoming = Array.isArray(assignedStaffIds) ? assignedStaffIds : [];
    return new Set(incoming.map((id) => String(id)));
  }, [assignedStaffIds]);

  // ===== STRICT: chỉ return staffId (không dùng accountId cho API) =====
  const getStaffIdStrict = (node) => {
    if (!node || typeof node !== 'object') return null;
    const q = [node];
    const seen = new Set();
    const add = (v) => { if (v && typeof v === 'object' && !seen.has(v)) { seen.add(v); q.push(v); } };

    while (q.length) {
      const cur = q.shift();
      if (!cur || typeof cur !== 'object') continue;

      if (cur.staffId !== undefined && cur.staffId !== null && cur.staffId !== '') {
        return cur.staffId;
      }

      if (Array.isArray(cur.bssStaffs)) cur.bssStaffs.forEach(add);
      add(cur.staff);
      add(cur.account);
      add(cur.staffRef);
      add(cur.accountRef);
      add(cur.staff?.account);
      add(cur.primaryBssRecord);
    }
    return null;
  };

  const normalizeStaffList = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        if (!item || typeof item !== 'object') return null;

        const bssRecords = Array.isArray(item.bssStaffs)
          ? item.bssStaffs.filter((record) => record && typeof record === 'object')
          : [];

        const primaryBssRecord =
          bssRecords.find((record) => record?.staffId) ?? bssRecords[0] ?? null;

        const staffCore = item.staff && typeof item.staff === 'object' ? item.staff : null;
        const accountCore =
          staffCore?.account && typeof staffCore.account === 'object'
            ? staffCore.account
            : item.account && typeof item.account === 'object'
            ? item.account
            : null;

        const resolvedId =
          getStaffIdStrict(item) ??
          getStaffIdStrict(staffCore) ??
          getStaffIdStrict(accountCore) ??
          getStaffIdStrict(primaryBssRecord);

        const normalized = {
          ...item,
          bssStaffs: bssRecords,
          primaryBssRecord: primaryBssRecord ?? undefined,
          staffRef: primaryBssRecord ?? staffCore ?? undefined,
          accountRef: accountCore ?? undefined,
        };

        if (resolvedId !== null && resolvedId !== undefined && resolvedId !== '') {
          normalized.staffId = resolvedId;
        }

        normalized.stationStaffId =
          normalized.stationStaffId ??
          normalized.staffStationId ??
          normalized.staffStationID ??
          primaryBssRecord?.stationStaffId ??
          primaryBssRecord?.staffStationId ??
          staffCore?.stationStaffId ??
          staffCore?.staffStationId ??
          item.id ??
          null;

        normalized.currentStationId =
          normalized.stationId ??
          primaryBssRecord?.stationId ??
          staffCore?.stationId ??
          null;

        const pick = (...values) =>
          values.find((val) => val !== undefined && val !== null && val !== '') ?? '';

        normalized.name = pick(
          normalized.name,
          staffCore?.name,
          accountCore?.name,
          primaryBssRecord?.account?.name,
          staffCore?.fullName,
          accountCore?.fullName
        );
        normalized.username = pick(
          normalized.username,
          staffCore?.username,
          accountCore?.username,
          accountCore?.userName
        );
        normalized.email = pick(normalized.email, staffCore?.email, accountCore?.email);
        normalized.phone = pick(normalized.phone, staffCore?.phone, accountCore?.phone);

        return normalized;
      })
      // chỉ giữ staff có staffId thật để API add luôn hợp lệ
      .filter((item) => item && item.staffId);
  };

  useEffect(() => {
    if (isOpen) {
      fetchStaffList();
    }
  }, [isOpen, stationId, assignedStaffIds]);

  const fetchStaffList = async () => {
    setLoading(true);
    setError(null);
    try {
      const staff = await authAPI.getAllStaff();
      const normalizedStaff = normalizeStaffList(staff);

      const extractAssignments = (member) =>
        Array.isArray(member?.bssStaffs)
          ? member.bssStaffs.filter((record) => record && typeof record === 'object')
          : [];

      if (!stationId) {
        // Chưa chọn trạm → show staff chưa gán trạm nào
        const unassigned = normalizedStaff.filter((m) => {
          const assignments = extractAssignments(m);
          return !assignments.some((a) => a?.stationId);
        });
        setStaffList(unassigned);
        return;
      }

      // Lấy staff đang thuộc trạm để LOẠI TRỪ — nếu API rỗng/lỗi, coi như []
      let normalizedCurrent = [];
      try {
        const currentStationStaff = await authAPI.getStaffsByStationId(stationId);
        normalizedCurrent = normalizeStaffList(currentStationStaff);
      } catch (_ignored) {
        normalizedCurrent = [];
      }

      const currentStaffIds = new Set(
        normalizedCurrent
          .map((member) => member.staffId)
          .filter((id) => id !== undefined && id !== null && id !== '')
          .map((id) => String(id))
      );

      // Chỉ lấy staff CHƯA gán ở đâu & chưa thuộc trạm này
      const availableStaff = normalizedStaff.filter((staffMember) => {
        const candidateId = staffMember.staffId || getStaffIdStrict(staffMember);
        if (!candidateId) return false;

        const candidateKey = String(candidateId);
        if (currentStaffIds.has(candidateKey)) return false;

        const assignments = extractAssignments(staffMember);
        const assignedToAnotherStation = assignments.some(
          (assignment) => assignment?.stationId && assignment.stationId !== stationId
        );
        if (assignedToAnotherStation) return false;

        const assignedElsewhere = assignments.some((assignment) => assignment?.stationId);
        if (assignedElsewhere) return false;

        if (assignedIdsSet.has(candidateKey)) return false;

        return true;
      });

      setStaffList(availableStaff);
    } catch (err) {
      console.error('Error fetching staff:', err);
      // chỉ coi là lỗi khi getAllStaff fail
      setError(err.message || 'Lỗi khi tải danh sách nhân viên có thể thêm');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (staff) => {
    if (!stationId) {
      alert("Không thể thêm nhân viên khi chưa chọn trạm.");
      return;
    }

    const staffName =
      staff?.name ||
      staff?.staffRef?.name ||
      staff?.accountRef?.name ||
      staff?.account?.name ||
      "nhân viên";

    const staffIdForApi = staff?.staffId || getStaffIdStrict(staff);
    if (!staffIdForApi) {
      alert("Không thể xác định staffId để thêm.");
      return;
    }

    try {
      await authAPI.addStaffToStation({ staffId: staffIdForApi, stationId });
      alert(`Đã thêm nhân viên ${staffName} vào trạm ${stationName}`);
      onStaffAdded?.();
      onClose?.();
    } catch (err) {
      console.error('Error adding staff to station:', err);
      alert('Lỗi khi thêm nhân viên: ' + (err.message || 'Không xác định'));
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredStaff = staffList.filter((staff) => {
    if (!normalizedSearch) return true;
    const name = (staff.name ?? '').toLowerCase();
    const username = (staff.username ?? '').toLowerCase();
    const email = (staff.email ?? '').toLowerCase();
    const phone = (staff.phone ?? '').toLowerCase();
    return (
      name.includes(normalizedSearch) ||
      username.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      phone.includes(normalizedSearch)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="staff-popup-overlay">
      <div className="staff-popup">
        <div className="staff-popup-header">
          <h3>Thêm nhân viên vào trạm: {stationName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="staff-popup-content">
          <div className="search-section">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading && <div className="loading">Đang tải danh sách nhân viên...</div>}

          {error && <div className="error">Lỗi: {error}</div>}

          {!loading && !error && (
            <div className="staff-list">
              {filteredStaff.length === 0 ? (
                <div className="no-staff">
                  {searchTerm ? 'Không tìm thấy nhân viên phù hợp' : 'Không có nhân viên nào có thể thêm'}
                </div>
              ) : (
                filteredStaff.map(staff => (
                  <div key={getStaffIdStrict(staff) || staff.accountId || staff.username} className="staff-item">
                    <div className="staff-info">
                      <div className="staff-name">{staff.name || 'Chưa có tên'}</div>
                      <div className="staff-username">@{staff.username}</div>
                      <div className="staff-details">
                        <span className="staff-phone">{staff.phone || 'Chưa có SĐT'}</span>
                        <span className="staff-email">{staff.email || 'Chưa có email'}</span>
                      </div>
                    </div>
                    <button className="add-staff-btn" onClick={() => handleAddStaff(staff)}>
                      Thêm vào trạm
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
