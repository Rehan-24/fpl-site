// pages/api/gwinfo.js

export default async function handler(req, res) {
  try {
    const response = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
    const data = await response.json();
    const currentGW = data.events.find((gw) => gw.is_next);

    if (currentGW) {
      const deadline = new Date(currentGW.deadline_time);
      res.status(200).json({
        gwNumber: currentGW.id,
        deadline: deadline.toLocaleString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          hour12: true,
          
        }),
      });
    } else {
      res.status(404).json({ message: 'Current gameweek not found' });
    }
  } catch (error) {
    console.error('Error fetching data from FPL API:', error);
    res.status(500).json({ message: 'Error fetching Gameweek info' });
  }
}
