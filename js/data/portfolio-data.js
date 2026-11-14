/**
 * Portfolio Data Store
 * Centralized content for VLSI projects, leadership events, journey steps, and event gallery.
 */

const vlsiProjects = [
  {
    name: "UART Transmitter & Receiver",
    tags: ["Verilog", "FSM", "Serial I/O"],
    blurb: "A synthesizable UART (8N1, 9600 baud at 50 MHz) with transmitter, receiver and a self-checking loopback testbench.",
    problem: "Send and receive bytes over a single serial line reliably, sampling each bit where the signal is most stable.",
    architecture: "Separate TX and RX modules share a four-state FSM (IDLE, START, DATA, STOP), joined by a loopback top module. Clocks per bit (5208) and baud rate are parameters.",
    implementation: "The receiver waits half a bit after the falling edge, re-checks the start bit to reject glitches, then samples every data bit at its midpoint. The transmitter holds tx_busy while a frame is on the line.",
    verification: "A self-checking testbench loops five bytes (0x41, 0x55, 0xA5, 0x00, 0xFF) from TX to RX, covering an ASCII character, alternating bits and the all-zeros and all-ones edge cases: 5/5 PASS.",
    learning: "How mid-bit sampling and start-bit re-checking make an asynchronous receiver robust, and how to parameterise timing cleanly.",
    waveforms: [
      { src: "assets/vlsi/uart-waveform.png", width: 2560, height: 1096, thumb: { src: "assets/vlsi/uart-waveform-card.webp", width: 800, height: 343 }, caption: "One frame: 0x41 ('A') on the serial line, labelled bit by bit", alt: "Simulation waveform of one UART frame carrying the byte 0x41: start bit, eight data bits LSB first, stop bit, with the TX and RX state machines and rx_done pulsing mid stop bit." },
      { src: "assets/vlsi/uart-waveform-full.png", width: 2560, height: 1096, caption: "Full testbench run: 41 55 A5 00 FF sent back to back, all received correctly", alt: "Simulation waveform of the full UART testbench run, five bytes looped from transmitter to receiver." }
    ],
    repo: "https://github.com/diveshreddy-ece/uart-verilog"
  },
  {
    name: "4-bit ALU",
    tags: ["Verilog", "Combinational", "Exhaustive TB"],
    blurb: "A combinational 4-bit ALU with eight operations and carry and zero flags, checked against every possible input.",
    problem: "Build a small ALU whose results and flags are provably correct for every opcode and operand, not just a few samples.",
    architecture: "One combinational block selects among ADD, SUB, AND, OR, XOR, NOT, INC and DEC with a 3-bit opcode. A 5-bit intermediate result captures the carry; zero is set whenever the result is 0000.",
    implementation: "Subtraction and decrement reuse the adder through two's complement (A + ~B + 1), the way real CPUs do it, so carry = 1 means no borrow.",
    verification: "A self-checking testbench compares the ALU with a reference model: 12 directed edge-case tests plus an exhaustive sweep of 8 opcodes × 16 × 16 inputs, 2060/2060 checks passed.",
    learning: "Exhaustive checking is cheap for small blocks and removes guesswork; flag conventions such as borrow need to be decided and documented up front.",
    waveforms: [
      { src: "assets/vlsi/alu-waveform.png", width: 2560, height: 936, thumb: { src: "assets/vlsi/alu-waveform-card.webp", width: 800, height: 293 }, caption: "Directed tests: one step per operation, then overflow, zero, borrow and underflow edge cases", alt: "Simulation waveform of the 4-bit ALU stepping through ADD, SUB, AND, OR, XOR, NOT, INC and DEC, then the overflow, zero-flag, borrow and underflow edge cases." }
    ],
    repo: "https://github.com/diveshreddy-ece/alu-4bit-verilog"
  },
  {
    name: "Smart Radar System",
    tags: ["Arduino", "Embedded", "Sensors"],
    blurb: "An embedded distance-sensing system built around an ultrasonic sensor and servo sweep to visualise nearby objects.",
    problem: "Build a low-cost radar-style system that can detect and visualise objects across a sweep angle.",
    architecture: "An ultrasonic sensor mounted on a servo sweeps across a range, with the microcontroller reading distance at each angle.",
    implementation: "Programmed on Arduino, reading ultrasonic pulses and driving the servo sweep, with data sent out for visualisation.",
    verification: "Tested by sweeping across objects at known distances and angles to confirm consistent readings.",
    learning: "Hands-on experience combining sensor timing, actuator control, and real-time data handling on embedded hardware.",
    photos: [
      { src: "assets/embedded/smart-radar.jpg", width: 600, height: 778, thumb: { src: "assets/embedded/smart-radar-card.webp", width: 600, height: 778 }, focus: "50% 30%", caption: "Running live: the ultrasonic sensor sweeps on a micro servo while the laptop plots each angle and distance on a radar display", alt: "An HC-SR04 ultrasonic sensor mounted on a blue micro servo on a breadboard, powered by a 9V battery, in front of a laptop showing a green radar sweep with detected objects shaded red." }
    ]
  },
  {
    name: "6 DOF Robotic Arm",
    tags: ["Arduino", "Servo Control", "Embedded"],
    blurb: "A six degrees-of-freedom robotic arm built with servo motors and microcontroller-driven joint control.",
    problem: "Control six independent joints smoothly and predictably from a single microcontroller.",
    architecture: "Each joint is driven by a servo motor, coordinated through a central control loop that maps target positions to servo angles.",
    implementation: "Built on Arduino with PWM-based servo control and a simple command interface for positioning each joint.",
    verification: "Verified through manual joint-by-joint movement tests and repeatability checks on target positions.",
    learning: "Deepened understanding of multi-actuator coordination and the practical limits of hobby servo precision.",
    photos: [
      { src: "assets/embedded/robotic-arm.jpg", width: 1600, height: 900, thumb: { src: "assets/embedded/robotic-arm-card.webp", width: 800, height: 450 }, caption: "The finished arm: 3D-printed orange and white links, a servo-driven gripper, and the breadboard wiring to the controller", alt: "The 6 DOF robotic arm on a desk: orange and white 3D-printed links on a round base, a white gripper at the end, servo cables bundled down the arm to a breadboard full of jumper wires." }
    ]
  }
];

const leadershipEvents = [
  { year: "2025", name: "Arduino Workshop", role: "Coordinator", desc: "Hands-on workshop introducing students to Arduino fundamentals and embedded projects." },
  { year: "2025", name: "Flyer Making Competition", role: "Coordinator", desc: "Creative design competition run for the student community." },
  { year: "2025", name: "C-Race", role: "Coordinator", desc: "Competitive programming event focused on C fundamentals." },
  { year: "2025", name: "Startup Autopsy", role: "Coordinator", desc: "Session breaking down real startup case studies for students." },
  { year: "2025", name: "IOTvate", role: "Coordinator", desc: "IoT-focused ideation and building event for student teams." },
  { year: "2025", name: "Creovate", role: "Coordinator", desc: "Creative-technical event blending design and engineering challenges. I also ran its social media and marketing, recognised with a Certificate of Appreciation." },
  { year: "", name: "Other Technical Events", role: "Coordinator — Digital Nexus", desc: "Additional workshops, competitions, and sessions organised through Digital Nexus." }
];

const journey = [
  "ECE Journey",
  "Arduino / Embedded Projects",
  "Digital Nexus",
  "Video Editing",
  "Verilog / SystemVerilog",
  "RTL / VLSI",
  "Current Goal: Digital IC Design"
];

const eventGallery = [
  {
    name: 'Digital Nexus',
    desc: 'Working together to organise technical events, workshops and creative opportunities for the student community.',
    image: 'https://res.cloudinary.com/dmnxhbzke/image/upload/v1788691857/WhatsApp_Image_2025-08-22_at_23.16.10_epim4b.jpg',
    alt: 'Digital Nexus student community',
    real: true
  },
  {
    name: 'Arduino Workshop',
    desc: 'A hands-on introduction to Arduino fundamentals, components and embedded project building.'
  },
  {
    name: 'Creovate',
    desc: 'A creative-technical event bringing students together through design and engineering challenges.'
  },
  {
    name: 'IOTvate',
    desc: 'An IoT-focused ideation and building event for student teams.'
  },
  {
    name: 'Flyer Making Competition',
    desc: 'A creative design competition encouraging visual communication and student participation.'
  },
  {
    name: 'Startup Autopsy',
    desc: 'A session exploring real startup case studies and the decisions behind them.'
  }
];

// Global namespace exposure
// Client testimonials, keyed by the case's data-testimonial slot in index.html.
// Only ever paste a quote the client actually gave, word for word, with their permission.
// Shape: { quote: "...", name: "Full name", role: "Role, Company" }. While a value is null the
// slot stays hidden; add ?drafts to the URL to see where it will appear.
const testimonials = {
  venomos: null,
  "brainy-circuits": null
};

window.PortfolioData = {
  vlsiProjects,
  testimonials,
  leadershipEvents,
  journey,
  eventGallery
};
