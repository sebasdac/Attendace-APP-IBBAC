
// MonthlyAttendanceScreen.js (Componente principal refactorizado)
import React, { useState, useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useMonthlyAttendance } from "../../hooks/useMonthlyAttendance";
import { Header } from "../../components/MonthlyAttendance/Header";
import { Controls } from "../../components/MonthlyAttendance/Controls";
import { LoadingSpinner } from "../../components/MonthlyAttendance/LoadingSpinner";
import { StatsCards } from "../../components/MonthlyAttendance/StatsCards";
import { WeeklyChart } from "../../components/MonthlyAttendance/WeeklyChart";
import { TopAttendees } from "../../components/MonthlyAttendance/TopAttendees";
import { PDFButton } from "../../components/MonthlyAttendance/PDFButton";
import { DetailedViewToggle } from "../../components/MonthlyAttendance/DetailedViewToggle";
import { CalendarView } from "../../components/MonthlyAttendance/CalendarView";
import { IndividualView } from "../../components/MonthlyAttendance/IndividualView";
import { SelectionModal } from "../../components/MonthlyAttendance/SelectionModal";

const MonthlyAttendanceScreen = ({ navigation }) => {
  const {
    classes,
    monthlyReport,
    loading,
    months,
    currentMonth,
    currentYear,
    generateMonthlyReport,
    getAttendeesForSession
  } = useMonthlyAttendance();

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showMonthModal, setShowMonthModal] = useState(false);
  const [reportType, setReportType] = useState('overview');
  const [detailedView, setDetailedView] = useState('calendar');

  // Auto-seleccionar primera clase si solo hay una
  useEffect(() => {
    if (classes.length === 1) {
      setSelectedClass(classes[0].name);
    }
  }, [classes]);

  // Auto-generar reporte cuando se seleccionen clase y mes
  useEffect(() => {
    if (selectedClass && selectedMonth) {
      generateMonthlyReport(selectedClass, selectedMonth);
    }
  }, [selectedClass, selectedMonth]);

  const renderOverviewReport = () => {
    if (!monthlyReport) return null;

    return (
      <View style={styles.reportSection}>
    
        <StatsCards monthlyReport={monthlyReport} />
        <WeeklyChart weeklyStats={monthlyReport.weeklyStats} />
        <TopAttendees topAttendees={monthlyReport.topAttendees} />
            {selectedClass && selectedMonth && monthlyReport && (
            <View style={styles.pdfButtonContainer}>
              <PDFButton
                monthlyReport={monthlyReport}
                selectedClass={selectedClass}
                selectedMonth={selectedMonth}
                currentYear={currentYear}
                disabled={loading}
                />
                </View>
              )}
      </View>
      
    );
  };

  const renderDetailedReport = () => {
    if (!monthlyReport) return null;

    const allKids = Object.keys(monthlyReport.attendanceByKid).sort();

    return (
      <View style={styles.detailedReportContainer}>
        <DetailedViewToggle 
          detailedView={detailedView}
          onViewChange={setDetailedView}
        />

        {detailedView === 'calendar' ? (
          <CalendarView 
            monthlyReport={monthlyReport}
            getAttendeesForSession={getAttendeesForSession}
          />
        ) : (
          <IndividualView 
            monthlyReport={monthlyReport}
            allKids={allKids}
          />
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Header onBackPress={() => navigation.goBack()} />

      <Controls
        selectedClass={selectedClass}
        selectedMonth={selectedMonth}
        reportType={reportType}
        onClassPress={() => setShowClassModal(true)}
        onMonthPress={() => setShowMonthModal(true)}
        onReportTypeChange={setReportType}
      />

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {reportType === 'overview' ? renderOverviewReport() : renderDetailedReport()}
        </>
      )}

      <SelectionModal
        visible={showClassModal}
        onClose={() => setShowClassModal(false)}
        title="Selecciona una Clase"
        items={classes.map(c => c.name)}
        selectedValue={selectedClass}
        onSelect={setSelectedClass}
      />

      <SelectionModal
        visible={showMonthModal}
        onClose={() => setShowMonthModal(false)}
        title="Selecciona un Mes"
        items={months}
        selectedValue={selectedMonth}
        onSelect={setSelectedMonth}
        renderItem={(month) => `${month} ${currentYear}`}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  reportSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  detailedReportContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  pdfButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});


export default MonthlyAttendanceScreen;