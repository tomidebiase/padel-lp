import ClubCard from '../components/ClubCard';

function Clubs() {
  const clubs = [
    {
      id: 1,
      name: 'Padel Center La Plata',
      location: 'La Plata',
    },
    {
      id: 2,
      name: 'Arena Padel City Bell',
      location: 'City Bell',
    },
    {
      id: 3,
      name: 'Gonnet Padel Club',
      location: 'Gonnet',
    },
  ];

  return (
    <section>
      <h1>Clubes disponibles</h1>
      <p>Seleccioná un club para ver sus canchas.</p>

      <div className="courts-grid">
        {clubs.map((club) => (
          <ClubCard key={club.id} club={club} />
        ))}
      </div>
    </section>
  );
}

export default Clubs;