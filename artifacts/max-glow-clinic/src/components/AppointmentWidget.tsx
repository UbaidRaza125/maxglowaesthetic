import { useEffect } from 'react';

const APPOINTMENT_WIDGET_SCRIPT_ID = 'instacare-appointment-widget-script';
const APPOINTMENT_WIDGET_SCRIPT_SRC =
  'https://app.instacare.pk//outreach/plugins/widget-appointment.js';

export function AppointmentWidget() {
  useEffect(() => {
    const existingScript = document.getElementById(
      APPOINTMENT_WIDGET_SCRIPT_ID,
    );

    if (existingScript) {
      return;
    }

    const script = document.createElement('script');
    script.id = APPOINTMENT_WIDGET_SCRIPT_ID;
    script.src = APPOINTMENT_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.setAttribute('data-host', 'https://app.instacare.pk/');
    script.setAttribute('data-user', 'SJA20260903063544');
    script.setAttribute('data-color', '#49c5bb');
    script.setAttribute('data-width', '370');
    script.setAttribute('data-height', '750');
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return <div className="scheduler" />;
}