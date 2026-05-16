const adminRepository = require("../models/adminRepository");

async function getSummary() {
  const [
    overview,
    revenueDaily,
    revenueMonthly,
    revenueBreakdown,
    appointmentBreakdown,
    topStaff,
    topServices,
    topProducts,
  ] = await Promise.all([
    adminRepository.getOverviewMetrics(),
    adminRepository.getRevenueByDay(14),
    adminRepository.getRevenueByMonth(6),
    adminRepository.getRevenueBreakdown(),
    adminRepository.getAppointmentStatusBreakdown(1),
    adminRepository.getTopStaffByRevenue(5),
    adminRepository.getTopServices(5),
    adminRepository.getTopProducts(5),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    overview,
    revenue: {
      total: overview.totalRevenue,
      service: revenueBreakdown.serviceRevenue,
      product: revenueBreakdown.productRevenue,
      daily: revenueDaily,
      monthly: revenueMonthly,
    },
    appointments: {
      total: overview.totalAppointments,
      pending: overview.pendingAppointments,
      completed: overview.completedAppointments,
      cancelled: overview.cancelledAppointments,
      monthlyBreakdown: appointmentBreakdown,
      cancellationRate:
        overview.totalAppointments > 0
          ? overview.cancelledAppointments / overview.totalAppointments
          : 0,
    },
    rankings: {
      topStaff,
      topServices,
      topProducts,
    },
  };
}

module.exports = {
  getSummary,
};
