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
    name: "Traffic Light Controller",
    tags: ["Verilog", "Moore FSM", "Timer"],
    blurb: "A two-road traffic light controller built as a four-state Moore FSM with a parameterised timer, checked cycle by cycle.",
    problem: "Hand right of way back and forth between the North-South and East-West roads with exact green and yellow times, and never show green to both roads.",
    architecture: "Four states (NS green, NS yellow, EW green, EW yellow) with combinational next-state and output logic and a single clocked block for the state and timer. Clock frequency, green time and yellow time are parameters; the timer width comes from $clog2 in 64-bit maths, so even 100 MHz × 60 s fits.",
    implementation: "The timer counts 0 to N-1 and timer_expired marks the last cycle, so the state change and the timer clear land on the same clock edge with no off-by-one. Reset is asynchronous, and the output decoder falls back to all-red.",
    verification: "A self-checking testbench checks the state, timer and both lamps on every cycle, times each phase from the outputs alone and checks safety on every output change, across 3 full loops, a reset mid-green and a 2 ns reset pulse: 256/256 cycle checks passed, and it passes at 3 more parameter sets. Planting 10 known bugs, it caught 8; the other 2 (blocking assignments) need a lint tool.",
    learning: "Non-blocking assignments are what keep the timer and the state in step, and a testbench is only trustworthy once it has been shown to fail on planted bugs.",
    waveforms: [
      { src: "assets/vlsi/traffic-light-waveform.png", width: 2560, height: 702, thumb: { src: "assets/vlsi/traffic-light-waveform-card.webp", width: 800, height: 219 }, caption: "Full run: three complete cycles, a reset in the middle of East-West green, then a 2 ns reset pulse", alt: "Simulation waveform of the traffic light controller: the state steps S0, S1, S2, S3 repeatedly, North-South and East-West lamps alternate green, yellow and red without ever both being green, the timer ramps up in each state, and two resets return the lights to North-South green." },
      { src: "assets/vlsi/traffic-light-waveform-zoom.png", width: 2560, height: 776, caption: "The S0 to S1 edge: timer_expired is high for the last cycle, then the state and timer change on the same clock edge", alt: "Zoomed simulation waveform around 145 ns: timer_count counts 7 to 11 while state_duration is 11, timer_expired goes high for one cycle, and on the next rising clock edge the state changes from S0 to S1, the timer returns to 0 and North-South turns from green to yellow." }
    ],
    repo: "https://github.com/diveshreddy-ece/traffic-light-controller-verilog"
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
