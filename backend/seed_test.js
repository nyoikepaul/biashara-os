const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting seed...');
    
    const tenant = await prisma.tenant.create({
      data: { 
        name: 'Demo Enterprise', 
        email: 'admin@demo.co.ke',
        slug: 'demo-enterprise'
      }
    });
    
    await prisma.employee.create({
      data: {
        name: 'John Doe',
        employeeNo: 'EMP001',
        idNumber: '12345678',
        department: 'Operations',
        designation: 'Manager',
        basicSalary: 55000,
        paymentMode: 'MPESA',
        tenantId: tenant.id
      }
    });
    
    console.log('✅ Seed successful! Tenant and Employee created.');
  } catch (e) {
    console.error('❌ Seed failed:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seed();
