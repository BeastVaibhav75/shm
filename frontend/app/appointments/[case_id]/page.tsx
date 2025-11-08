"use client"

import AppointmentCaseView from "@/components/appointments/AppointmentCaseView.jsx"

export default function AppointmentCaseRoute({ params }: { params: { case_id: string } }) {
  return <AppointmentCaseView params={params} />
}