import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBills() {
  console.log("🌱 Seeding bills data...");

  // Sample wallet addresses
  const addresses = {
    user1: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
    user2: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199",
    agent1: "0xdD2FD4581271e230360230F9337D5c0430Bf44C0",
    agent2: "0xbDA5747bFD65F08deb54cb465eB87D40e51B197E",
    agent3: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30"
  };

  // Create bills for different months with amounts matching UI design
  // Total should be ~14.82 ETH income, ~5.21 ETH spent
  const bills = [
    // 2024年3月 - 1.2 ETH income
    {
      id: "bill_2024_03_001",
      jobId: "job_001",
      agentId: "agent_001",
      amount: 0.5,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_001",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.user2,
      createdAt: new Date("2024-03-05T10:00:00Z"),
      paidAt: new Date("2024-03-06T10:00:00Z")
    },
    {
      id: "bill_2024_03_002",
      jobId: "job_002",
      agentId: "agent_002",
      amount: 0.7,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_002",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.agent1,
      createdAt: new Date("2024-03-15T14:30:00Z"),
      paidAt: new Date("2024-03-16T09:00:00Z")
    },

    // 2024年2月 - 0.9 ETH income
    {
      id: "bill_2024_02_001",
      jobId: "job_003",
      agentId: "agent_003",
      amount: 0.4,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_003",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.agent2,
      createdAt: new Date("2024-02-10T11:20:00Z"),
      paidAt: new Date("2024-02-11T15:45:00Z")
    },
    {
      id: "bill_2024_02_002",
      jobId: "job_004",
      agentId: "agent_001",
      amount: 0.5,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_004",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.user2,
      createdAt: new Date("2024-02-20T16:00:00Z"),
      paidAt: new Date("2024-02-21T10:30:00Z")
    },

    // 2024年1月 - 2.5 ETH income
    {
      id: "bill_2024_01_001",
      jobId: "job_005",
      agentId: "agent_002",
      amount: 1.0,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_005",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.agent3,
      createdAt: new Date("2024-01-08T09:15:00Z"),
      paidAt: new Date("2024-01-09T11:00:00Z")
    },
    {
      id: "bill_2024_01_002",
      jobId: "job_006",
      agentId: "agent_003",
      amount: 0.8,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_006",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.user2,
      createdAt: new Date("2024-01-15T13:45:00Z"),
      paidAt: new Date("2024-01-16T08:30:00Z")
    },
    {
      id: "bill_2024_01_003",
      jobId: "job_007",
      agentId: "agent_001",
      amount: 0.7,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_007",
      payeeAddress: addresses.user1, // User receives
      payerAddress: addresses.agent1,
      createdAt: new Date("2024-01-25T10:00:00Z"),
      paidAt: new Date("2024-01-26T14:20:00Z")
    },

    // Additional bills to reach total of ~14.82 ETH
    // More 2024年3月
    {
      id: "bill_2024_03_003",
      jobId: "job_008",
      agentId: "agent_002",
      amount: 1.5,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_008",
      payeeAddress: addresses.user1,
      payerAddress: addresses.agent2,
      createdAt: new Date("2024-03-20T12:00:00Z"),
      paidAt: new Date("2024-03-21T10:00:00Z")
    },
    {
      id: "bill_2024_03_004",
      jobId: "job_009",
      agentId: "agent_003",
      amount: 2.8,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_009",
      payeeAddress: addresses.user1,
      payerAddress: addresses.user2,
      createdAt: new Date("2024-03-28T15:30:00Z"),
      paidAt: new Date("2024-03-29T09:15:00Z")
    },

    // More 2024年2月
    {
      id: "bill_2024_02_003",
      jobId: "job_010",
      agentId: "agent_001",
      amount: 1.8,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_010",
      payeeAddress: addresses.user1,
      payerAddress: addresses.agent3,
      createdAt: new Date("2024-02-25T11:00:00Z"),
      paidAt: new Date("2024-02-26T13:30:00Z")
    },

    // More 2024年1月
    {
      id: "bill_2024_01_004",
      jobId: "job_011",
      agentId: "agent_002",
      amount: 2.2,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_011",
      payeeAddress: addresses.user1,
      payerAddress: addresses.agent1,
      createdAt: new Date("2024-01-30T16:20:00Z"),
      paidAt: new Date("2024-01-31T10:45:00Z")
    },

    // Spending bills (where user is payer) - total ~5.21 ETH
    {
      id: "bill_spend_001",
      jobId: "job_012",
      agentId: "agent_001",
      amount: 2.1,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_012",
      payeeAddress: addresses.agent1,
      payerAddress: addresses.user1, // User pays
      createdAt: new Date("2024-03-10T10:00:00Z"),
      paidAt: new Date("2024-03-11T11:00:00Z")
    },
    {
      id: "bill_spend_002",
      jobId: "job_013",
      agentId: "agent_002",
      amount: 1.8,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_013",
      payeeAddress: addresses.agent2,
      payerAddress: addresses.user1, // User pays
      createdAt: new Date("2024-02-12T14:30:00Z"),
      paidAt: new Date("2024-02-13T09:20:00Z")
    },
    {
      id: "bill_spend_003",
      jobId: "job_014",
      agentId: "agent_003",
      amount: 1.31,
      currency: "ETH",
      status: "PAID",
      escrowId: "escrow_014",
      payeeAddress: addresses.agent3,
      payerAddress: addresses.user1, // User pays
      createdAt: new Date("2024-01-18T12:15:00Z"),
      paidAt: new Date("2024-01-19T10:00:00Z")
    }
  ];

  // Insert bills into database
  let successCount = 0;
  for (const bill of bills) {
    try {
      await prisma.bill.create({
        data: bill
      });
      successCount++;
    } catch (error) {
      console.error(`Failed to create bill ${bill.id}:`, error);
    }
  }

  console.log(`✅ Successfully seeded ${successCount}/${bills.length} bills`);
  
  // Calculate totals for verification
  const totalIncome = bills
    .filter(b => b.payeeAddress === addresses.user1)
    .reduce((sum, b) => sum + b.amount, 0);
  
  const totalSpent = bills
    .filter(b => b.payerAddress === addresses.user1)
    .reduce((sum, b) => sum + b.amount, 0);

  console.log(`📊 Total Income: ${totalIncome.toFixed(2)} ETH`);
  console.log(`📊 Total Spent: ${totalSpent.toFixed(2)} ETH`);
}
