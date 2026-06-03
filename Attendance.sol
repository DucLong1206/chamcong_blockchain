// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Attendance {
    // Sự kiện được phát ra mỗi khi có người chấm công (Giúp Blockchain ghi nhận dữ liệu)
    event AttendanceMarked(address indexed worker, string data, uint256 timestamp);

    // Hàm nhận dữ liệu rác hoặc dữ liệu có chủ đích
    // Khi gọi hàm này, bạn truyền chuỗi data vào, nó sẽ lưu vĩnh viễn lên Blockchain
    function saveAttendanceData(string memory _data) public {
        emit AttendanceMarked(msg.sender, _data, block.timestamp);
    }
    
    // Hàm fallback để nhận dữ liệu rỗng hoặc nhận Data rác (Giúp lách luật MetaMask)
    // Nếu bạn chỉ đẩy Data vào 'txParams' mà không gọi hàm cụ thể, nó sẽ nhảy vào đây
    fallback() external payable {}
    receive() external payable {}
}
