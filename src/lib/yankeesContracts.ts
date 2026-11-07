export type AnnualCommitment = {
  amount: number;
  status: "guaranteed" | "club-option" | "player-opt-out-contingent";
  note?: string;
  guaranteedBuyout?: number;
  teamOffset?: number;
};

export type YankeesContract = {
  playerId: number;
  playerName: string;
  position: string;
  salariesByYear: Record<number, AnnualCommitment>;
  contractNote?: string;
  sourceName: string;
  sourceUrl: string;
  secondarySourceUrl?: string;
  lastVerified: string;
};

const FAN_GRAPHS =
  "https://www.fangraphs.com/roster-resource/payroll/yankees?season=2026";

export const yankeesContracts: YankeesContract[] = [
  {
    playerId: 641355,
    playerName: "Cody Bellinger",
    position: "OF",
    salariesByYear: {
      2027: { amount: 42500000, status: "guaranteed" },
      2028: { amount: 25800000, status: "player-opt-out-contingent" },
      2029: { amount: 25800000, status: "player-opt-out-contingent" },
      2030: { amount: 25900000, status: "player-opt-out-contingent" },
    },
    contractNote:
      "Player opt-outs after 2027 and 2028. Payroll charges include signing-bonus allocation.",
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    secondarySourceUrl:
      "https://apnews.com/article/905445562bf6d1e96409c5643f8934a8",
    lastVerified: "2026-11-06",
  },
  {
    playerId: 592450,
    playerName: "Aaron Judge",
    position: "OF",
    salariesByYear: {
      2027: { amount: 40000000, status: "guaranteed" },
      2028: { amount: 40000000, status: "guaranteed" },
      2029: { amount: 40000000, status: "guaranteed" },
      2030: { amount: 40000000, status: "guaranteed" },
      2031: { amount: 40000000, status: "guaranteed" },
    },
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
  {
    playerId: 543037,
    playerName: "Gerrit Cole",
    position: "SP",
    salariesByYear: {
      2027: { amount: 36000000, status: "guaranteed" },
      2028: { amount: 36000000, status: "guaranteed" },
    },
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
  {
    playerId: 608331,
    playerName: "Max Fried",
    position: "SP",
    salariesByYear: {
      2027: { amount: 31500000, status: "guaranteed" },
      2028: { amount: 31500000, status: "guaranteed" },
      2029: { amount: 31500000, status: "guaranteed" },
      2030: { amount: 31500000, status: "guaranteed" },
      2031: { amount: 31500000, status: "guaranteed" },
      2032: { amount: 31500000, status: "guaranteed" },
    },
    contractNote:
      "Annual payroll charge includes signing-bonus allocation; AAV is $27.25M.",
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
  {
    playerId: 607074,
    playerName: "Carlos Rodón",
    position: "SP",
    salariesByYear: {
      2027: { amount: 27833333, status: "guaranteed" },
      2028: { amount: 27833333, status: "guaranteed" },
    },
    contractNote:
      "Annual payroll charge differs from the $27M average annual value.",
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
  {
    playerId: 519317,
    playerName: "Giancarlo Stanton",
    position: "DH",
    salariesByYear: {
      2027: {
        amount: 25000000,
        status: "guaranteed",
        teamOffset: 3000000,
        note: "Miami owes the Yankees $3M toward this season.",
      },
      2028: {
        amount: 25000000,
        status: "club-option",
        guaranteedBuyout: 10000000,
        note: "$10M buyout if the club declines the option.",
      },
    },
    contractNote:
      "2028 is a club option, not a guaranteed $25M salary.",
    sourceName: "MLB.com",
    sourceUrl:
      "https://www.mlb.com/amp/news/giancarlo-stanton-left-calf-strain-could-end-2026-season.html",
    secondarySourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
  {
    playerId: 641857,
    playerName: "Ryan McMahon",
    position: "3B",
    salariesByYear: {
      2027: { amount: 16000000, status: "guaranteed" },
    },
    sourceName: "FanGraphs RosterResource",
    sourceUrl: FAN_GRAPHS,
    lastVerified: "2026-11-06",
  },
];

export type YankeesArbitrationProjection = {
  playerId: number;
  playerName: string;
  position: string;
  projectedSalary: number;
  status: "projected";
  sourceName: string;
  sourceUrl: string;
  lastVerified: string;
};

export const yankeesArbitrationProjections: YankeesArbitrationProjection[] = [
  {
    playerId: 671277,
    playerName: "Luis García Jr.",
    position: "1B",
    projectedSalary: 11000000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 657376,
    playerName: "Clarke Schmidt",
    position: "SP",
    projectedSalary: 4500000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 683011,
    playerName: "Anthony Volpe",
    position: "SS",
    projectedSalary: 4000000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 676609,
    playerName: "José Caballero",
    position: "SS",
    projectedSalary: 3700000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 671218,
    playerName: "Heliot Ramos",
    position: "OF",
    projectedSalary: 3200000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 677960,
    playerName: "Ryan Weathers",
    position: "SP",
    projectedSalary: 3100000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 669224,
    playerName: "Austin Wells",
    position: "C",
    projectedSalary: 2600000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 518585,
    playerName: "Fernando Cruz",
    position: "RP",
    projectedSalary: 2300000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
  {
    playerId: 661563,
    playerName: "Luis Gil",
    position: "SP",
    projectedSalary: 2300000,
    status: "projected",
    sourceName: "MLB Trade Rumors / Matt Swartz via SNY",
    sourceUrl: "https://sports.yahoo.com/articles/heres-yankees-arbitration-eligible-players-174456201.html",
    lastVerified: "2026-10-05",
  },
];

export type YankeesPreArbitrationPlayer = {
  playerName: string;
  position: string;
  projectedSalary: null;
  status: "pending-verification";
};

export const yankeesPreArbitrationPlayers: YankeesPreArbitrationPlayer[] = [
  { playerName: "Ben Rice", position: "1B/DH", projectedSalary: null, status: "pending-verification" },
  { playerName: "Jasson Domínguez", position: "OF", projectedSalary: null, status: "pending-verification" },
  { playerName: "Will Warren", position: "SP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Cam Schlittler", position: "SP", projectedSalary: null, status: "pending-verification" },
  { playerName: "J.C. Escarra", position: "C", projectedSalary: null, status: "pending-verification" },
  { playerName: "Brent Headrick", position: "RP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Angel Chivilli", position: "RP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Kervin Castro", position: "RP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Ali Sánchez", position: "C", projectedSalary: null, status: "pending-verification" },
  { playerName: "Bradley Hanner", position: "RP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Brendan Beck", position: "P", projectedSalary: null, status: "pending-verification" },
  { playerName: "Elmer Rodríguez", position: "P", projectedSalary: null, status: "pending-verification" },
  { playerName: "Marco Luciano", position: "SS", projectedSalary: null, status: "pending-verification" },
  { playerName: "Max Schuemann", position: "OF", projectedSalary: null, status: "pending-verification" },
  { playerName: "Yerry De los Santos", position: "RP", projectedSalary: null, status: "pending-verification" },
  { playerName: "Spencer Jones", position: "OF", projectedSalary: null, status: "pending-verification" },
  { playerName: "George Lombard Jr.", position: "SS", projectedSalary: null, status: "pending-verification" },
];
