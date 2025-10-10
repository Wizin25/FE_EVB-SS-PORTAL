import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message } from 'antd';

// Giả lập API
const mockBatteryReports = [
  { id: 1, batteryId: 'BAT001', status: 'Tại trạm', lastUpdate: '2024-06-10 10:00' },
  { id: 2, batteryId: 'BAT002', status: 'Đang trong xe', lastUpdate: '2024-06-10 09:30' },
];

const mockExchangeBatteries = [
  { id: 1, customer: 'Nguyễn Văn A', batteryId: 'BAT001', time: '2024-06-10 10:05' },
];

const mockStationSchedule = [
  { id: 1, customer: 'Nguyễn Văn A', time: '2024-06-10 10:05' },
  { id: 2, customer: 'Trần Thị B', time: '2024-06-10 11:00' },
];

function StaffPage() {
  const [batteryReports, setBatteryReports] = useState([]);
  const [exchangeBatteries, setExchangeBatteries] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Giả lập fetch dữ liệu ban đầu
  useEffect(() => {
    setBatteryReports(mockBatteryReports);
    setExchangeBatteries(mockExchangeBatteries);
  }, []);

  // Tự động update batteryReport khi pin đến/rời trạm
  const updateBatteryStatus = (batteryId, status) => {
    setBatteryReports(prev =>
      prev.map(b =>
        b.batteryId === batteryId
          ? { ...b, status, lastUpdate: new Date().toLocaleString() }
          : b
      )
    );
    message.success(`Đã cập nhật trạng thái pin ${batteryId} thành "${status}"`);
  };

  // Tạo ExchangeBattery mới khi khách đến đổi pin
  const handleCreateExchange = (values) => {
    const { customer, batteryId } = values;
    const newExchange = {
      id: exchangeBatteries.length + 1,
      customer,
      batteryId,
      time: new Date().toLocaleString(),
    };
    setExchangeBatteries(prev => [newExchange, ...prev]);
    updateBatteryStatus(batteryId, 'Đang trong xe');
    setIsModalVisible(false);
    form.resetFields();
    message.success('Tạo ExchangeBattery thành công!');
  };

  // Hiển thị modal tạo ExchangeBattery
  const showCreateModal = () => {
    setIsModalVisible(true);
  };

  // Cột cho bảng batteryReport
  const batteryColumns = [
    { title: 'Mã Pin', dataIndex: 'batteryId', key: 'batteryId' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status' },
    { title: 'Cập nhật lần cuối', dataIndex: 'lastUpdate', key: 'lastUpdate' },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Select
          value={record.status}
          style={{ width: 140 }}
          onChange={status => updateBatteryStatus(record.batteryId, status)}
          options={[
            { value: 'Tại trạm', label: 'Tại trạm' },
            { value: 'Đang trong xe', label: 'Đang trong xe' },
          ]}
        />
      ),
    },
  ];

  // Cột cho bảng ExchangeBattery
  const exchangeColumns = [
    { title: 'Khách hàng', dataIndex: 'customer', key: 'customer' },
    { title: 'Mã Pin', dataIndex: 'batteryId', key: 'batteryId' },
    { title: 'Thời gian đổi', dataIndex: 'time', key: 'time' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>Quản lý Trạm - Nhân viên</h1>

      <section style={{ marginBottom: 32 }}>
        <h2>Battery Report của trạm</h2>
        <Table
          dataSource={batteryReports}
          columns={batteryColumns}
          rowKey="id"
          pagination={false}
        />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2>Lịch sử ExchangeBattery</h2>
        <Button type="primary" onClick={showCreateModal} style={{ marginBottom: 16 }}>
          Tạo ExchangeBattery mới
        </Button>
        <Table
          dataSource={exchangeBatteries}
          columns={exchangeColumns}
          rowKey="id"
          pagination={false}
        />
      </section>

      <Modal
        title="Tạo ExchangeBattery"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateExchange}>
          <Form.Item
            label="Khách hàng"
            name="customer"
            rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Chọn Pin"
            name="batteryId"
            rules={[{ required: true, message: 'Vui lòng chọn pin' }]}
          >
            <Select placeholder="Chọn pin đang có tại trạm">
              {batteryReports
                .filter(b => b.status === 'Tại trạm')
                .map(b => (
                  <Select.Option key={b.batteryId} value={b.batteryId}>
                    {b.batteryId}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Tạo ExchangeBattery
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StaffPage;
