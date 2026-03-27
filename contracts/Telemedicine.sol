// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Telemedicine {

    address public admin;
    uint public appointmentCounter;

    constructor() {
        admin = msg.sender;
    }

    // ==========================
    // STRUCTS
    // ==========================

    struct Doctor {
        string name;
        string specialization;
        uint rating;
        uint totalRatings;
        bool isVerified;
        bool exists;
    }

    struct Patient {
        string name;
        uint age;
        string gender;
        bool exists;
    }

    struct Appointment {
        uint id;
        address patient;
        address doctor;
        string healthIssue;
        string meetingLink;
        uint consultationFee;
        uint status; // 0=requested,1=approved,2=completed,3=cancelled
        bool isPaid;
    }

    mapping(address => Doctor) public doctors;
    mapping(address => Patient) public patients;
    mapping(uint => Appointment) public appointments;

    // ==========================
    // EVENTS
    // ==========================

    event PatientRegistered(address indexed patient, string name);
    event DoctorRegistered(address indexed doctor, string name, string specialization);
    event DoctorVerified(address indexed doctor);

    event AppointmentRequested(uint indexed id, address indexed patient, address indexed doctor, string healthIssue, uint consultationFee);
    event AppointmentApproved(uint indexed id, address indexed doctor, string meetingLink);
    event AppointmentCompleted(uint indexed id, address indexed doctor);
    event ConsultationPaid(uint indexed id, address indexed patient, address indexed doctor, uint amount);
    event DoctorRated(uint indexed id, address indexed patient, address indexed doctor, uint rating);

    // ==========================
    // MODIFIERS
    // ==========================

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyVerifiedDoctor() {
        require(doctors[msg.sender].isVerified, "Doctor not verified");
        _;
    }

    modifier onlyPatient() {
        require(patients[msg.sender].exists, "Not registered patient");
        _;
    }

    // ==========================
    // REGISTRATION
    // ==========================

    function registerDoctor(string memory _name, string memory _specialization) public {
        require(!doctors[msg.sender].exists, "Already registered");

        doctors[msg.sender] = Doctor(
            _name,
            _specialization,
            5, // initial rating
            0,
            false,
            true
        );

        emit DoctorRegistered(msg.sender, _name, _specialization);
    }

    function verifyDoctor(address _doctor) public onlyAdmin {
        require(doctors[_doctor].exists, "Doctor not found");
        doctors[_doctor].isVerified = true;
        emit DoctorVerified(_doctor);
    }

    function registerPatient(string memory _name, uint _age, string memory _gender) public {
        require(!patients[msg.sender].exists, "Already registered");

        patients[msg.sender] = Patient(
            _name,
            _age,
            _gender,
            true
        );

        emit PatientRegistered(msg.sender, _name);
    }

    // ==========================
    // APPOINTMENTS
    // ==========================

    function requestAppointment(address _doctor, string memory _healthIssue)
        public
        onlyPatient
    {
        require(doctors[_doctor].isVerified, "Doctor not verified");

        uint baseFee = calculateBaseFee(_healthIssue);
        uint finalFee = baseFee + (doctors[_doctor].rating * 1e15);

        appointmentCounter++;

        appointments[appointmentCounter] = Appointment(
            appointmentCounter,
            msg.sender,
            _doctor,
            _healthIssue,
            "",
            finalFee,
            0,
            false
        );

        emit AppointmentRequested(appointmentCounter, msg.sender, _doctor, _healthIssue, finalFee);
    }

    function approveAppointment(uint _id, string memory _meetingLink)
        public
        onlyVerifiedDoctor
    {
        Appointment storage appt = appointments[_id];

        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.status == 0, "Invalid status");

        appt.status = 1;
        appt.meetingLink = _meetingLink;

        emit AppointmentApproved(_id, msg.sender, _meetingLink);
    }

    function completeAppointment(uint _id)
        public
        onlyVerifiedDoctor
    {
        Appointment storage appt = appointments[_id];

        require(appt.doctor == msg.sender, "Not your appointment");
        require(appt.status == 1, "Not approved");

        appt.status = 2;

        emit AppointmentCompleted(_id, msg.sender);
    }

    function payConsultation(uint _id)
        public
        payable
        onlyPatient
    {
        Appointment storage appt = appointments[_id];

        require(appt.patient == msg.sender, "Not your appointment");
        require(appt.status == 1, "Appointment not approved");
        require(!appt.isPaid, "Already paid");
        require(msg.value == appt.consultationFee, "Incorrect fee");

        appt.isPaid = true;
        payable(appt.doctor).transfer(msg.value);

        emit ConsultationPaid(_id, appt.patient, appt.doctor, msg.value);
    }

    // ==========================
    // RATING SYSTEM
    // ==========================

    function rateDoctor(uint _id, uint _rating) public onlyPatient {
        require(_rating >= 1 && _rating <= 5, "Invalid rating");

        Appointment storage appt = appointments[_id];

        require(appt.patient == msg.sender, "Not your appointment");
        require(appt.status == 2, "Not completed");
        require(appt.isPaid, "Payment pending");

        Doctor storage doc = doctors[appt.doctor];

        doc.totalRatings++;
        doc.rating = (doc.rating + _rating) / 2;

        emit DoctorRated(_id, appt.patient, appt.doctor, _rating);
    }

    // ==========================
    // INTERNAL FEE LOGIC
    // ==========================

    function calculateBaseFee(string memory issue) internal pure returns (uint) {

        bytes32 issueHash = keccak256(abi.encodePacked(issue));

        if(issueHash == keccak256("fever")) {
            return 0.01 ether;
        }

        if(issueHash == keccak256("internal")) {
            return 0.05 ether;
        }

        if(issueHash == keccak256("cancer")) {
            return 0.1 ether;
        }

        return 0.02 ether; // default
    }
}
