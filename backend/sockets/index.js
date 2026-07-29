// Thin wrapper around Socket.io setup so server.js stays readable.
// Events emitted:
//   'attendance:new'   -> { student, course_id, room_label, scanned_at }
//     fired from attendanceController.markBiometric on every successful scan
//   'device:status'    -> { device_id, status }
//     (optional) fired if you wire up ESP32 heartbeat/offline detection
function initSockets(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    console.log(`Total connected sockets: ${io.engine.clientsCount}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
}

module.exports = initSockets;
