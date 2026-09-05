'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

type Candidate = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  age?: number | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: string | null;
  height_cm?: number | null;
  height_centimetres?: number | null;
  experience?: string | null;
  availability?: string | null;
  status?: string | null;
  gender?: string | null;
};

function getSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function ProductionDashboard() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [ageFrom, setAgeFrom] = useState('');
  const [ageTo, setAgeTo] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [heightFrom, setHeightFrom] = useState('');
  const [heightTo, setHeightTo] = useState('');
  const [experience, setExperience] = useState('');
  const [availability, setAvailability] = useState('');
  const [status, setStatus] = useState('');

  const [selectedCandidate, setSelectedCandidate] =
    useState<Candidate | null>(null);

  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/produkce');
      return;
    }

    const { data, error } = await supabase
      .from('candidates')
      .select('*');

    if (error) {
      console.error(error);
      setError('Nepodařilo se načíst uchazeče.');
      setLoading(false);
      return;
    }

    setCandidates(data || []);
    setLoading(false);
  }

  async function openCandidate(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setPhotos([]);

    const { data, error } = await supabase.storage
      .from('fotky-hercu')
      .list(candidate.id);

    if (error || !data) return;

    const photoUrls = data
      .filter((file) => {
        const name = file.name.toLowerCase();

        return (
          name.endsWith('.jpg') ||
          name.endsWith('.jpeg') ||
          name.endsWith('.png') ||
          name.endsWith('.webp')
        );
      })
      .map((file) => {
        const { data: publicUrl } = supabase.storage
          .from('fotky-hercu')
          .getPublicUrl(`${candidate.id}/${file.name}`);

        return publicUrl.publicUrl;
      });

    setPhotos(photoUrls);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/produkce');
  }

  function clearFilters() {
    setSearch('');
    setAgeFrom('');
    setAgeTo('');
    setGender('');
    setCity('');
    setRole('');
    setHeightFrom('');
    setHeightTo('');
    setExperience('');
    setAvailability('');
    setStatus('');
  }

  const cities = Array.from(
    new Set(candidates.map((c) => c.city).filter(Boolean))
  ).sort();

  const roles = Array.from(
    new Set(candidates.map((c) => c.role).filter(Boolean))
  ).sort();

  const genders = Array.from(
    new Set(candidates.map((c) => c.gender).filter(Boolean))
  ).sort();

  const experiences = Array.from(
    new Set(candidates.map((c) => c.experience).filter(Boolean))
  ).sort();

  const availabilities = Array.from(
    new Set(candidates.map((c) => c.availability).filter(Boolean))
  ).sort();

  const statuses = Array.from(
    new Set(candidates.map((c) => c.status).filter(Boolean))
  ).sort();

  const filteredCandidates = candidates.filter((candidate) => {
    const text = search.toLowerCase().trim();

    const name =
      `${candidate.first_name || ''} ${candidate.last_name || ''}`.toLowerCase();

    const matchesSearch =
      !text ||
      name.includes(text) ||
      (candidate.email || '').toLowerCase().includes(text) ||
      (candidate.city || '').toLowerCase().includes(text) ||
      (candidate.role || '').toLowerCase().includes(text);

    const age = Number(candidate.age);

    const matchesAgeFrom =
      !ageFrom || (!Number.isNaN(age) && age >= Number(ageFrom));

    const matchesAgeTo =
      !ageTo || (!Number.isNaN(age) && age <= Number(ageTo));

    const matchesGender =
      !gender || candidate.gender === gender;

    const matchesCity =
      !city || candidate.city === city;

    const matchesRole =
      !role || candidate.role === role;

    const height =
      candidate.height_cm ?? candidate.height_centimetres ?? null;

    const matchesHeightFrom =
      !heightFrom ||
      (height !== null && height >= Number(heightFrom));

    const matchesHeightTo =
      !heightTo ||
      (height !== null && height <= Number(heightTo));

    const matchesExperience =
      !experience || candidate.experience === experience;

    const matchesAvailability =
      !availability || candidate.availability === availability;

    const matchesStatus =
      !status || candidate.status === status;

    return (
      matchesSearch &&
      matchesAgeFrom &&
      matchesAgeTo &&
      matchesGender &&
      matchesCity &&
      matchesRole &&
      matchesHeightFrom &&
      matchesHeightTo &&
      matchesExperience &&
      matchesAvailability &&
      matchesStatus
    );
  });

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#000',
        color: '#fff',
        padding: '30px',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px',
            flexWrap: 'wrap',
            gap: '15px',
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: '32px',
              }}
            >
              Produkce
            </h1>

            <p
              style={{
                color: '#aaa',
                marginTop: '6px',
              }}
            >
              Přehled přihlášených uchazečů
            </p>
          </div>

          <button
            onClick={logout}
            style={buttonStyle}
          >
            Odhlásit
          </button>
        </header>

        {error && (
          <div
            style={{
              background: '#250000',
              border: '1px solid #700',
              color: '#fff',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <section
          style={{
            background: '#111',
            border: '1px solid #292929',
            padding: '20px',
            borderRadius: '15px',
            marginBottom: '25px',
          }}
        >
          <h2
            style={{
              marginTop: 0,
              marginBottom: '18px',
            }}
          >
            Filtrování
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <input
              placeholder="Hledat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Věk od"
              value={ageFrom}
              onChange={(e) => setAgeFrom(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Věk do"
              value={ageTo}
              onChange={(e) => setAgeTo(e.target.value)}
              style={inputStyle}
            />

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              style={inputStyle}
            >
              <option value="">Pohlaví</option>
              {genders.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
            >
              <option value="">Město</option>
              {cities.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              <option value="">Role</option>
              {roles.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Výška od"
              value={heightFrom}
              onChange={(e) => setHeightFrom(e.target.value)}
              style={inputStyle}
            />

            <input
              type="number"
              placeholder="Výška do"
              value={heightTo}
              onChange={(e) => setHeightTo(e.target.value)}
              style={inputStyle}
            />

            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              style={inputStyle}
            >
              <option value="">Zkušenosti</option>
              {experiences.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              style={inputStyle}
            >
              <option value="">Dostupnost</option>
              {availabilities.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="">Status</option>
              {statuses.map((item) => (
                <option key={item} value={item || ''}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #444',
                background: '#fff',
                color: '#000',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Vymazat filtry
            </button>
          </div>

          <p
            style={{
              color: '#aaa',
              marginBottom: 0,
              marginTop: '18px',
            }}
          >
            Zobrazeno:{' '}
            <strong style={{ color: '#fff' }}>
              {filteredCandidates.length}
            </strong>{' '}
            z {candidates.length}
          </p>
        </section>

        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '50px',
              color: '#aaa',
            }}
          >
            Načítám uchazeče...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '50px',
              color: '#aaa',
            }}
          >
            Žádní uchazeči neodpovídají filtrům.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}
          >
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onClick={() => openCandidate(candidate)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedCandidate && (
        <div
          onClick={() => setSelectedCandidate(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '15px',
              maxWidth: '900px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '25px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2>
                {selectedCandidate.first_name}{' '}
                {selectedCandidate.last_name}
              </h2>

              <button
                onClick={() => setSelectedCandidate(null)}
                style={{
                  border: '1px solid #444',
                  background: '#222',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  cursor: 'pointer',
                  fontSize: '18px',
                }}
              >
                ×
              </button>
            </div>

            {photos.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(180px, 1fr))',
                  gap: '12px',
                  marginBottom: '25px',
                }}
              >
                {photos.map((photo, index) => (
                  <img
                    key={photo}
                    src={photo}
                    alt={`Fotka ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '220px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />
                ))}
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '12px',
              }}
            >
              <Info
                label="Jméno"
                value={`${selectedCandidate.first_name || ''} ${
                  selectedCandidate.last_name || ''
                }`}
              />

              <Info
                label="Věk"
                value={selectedCandidate.age}
              />

              <Info
                label="Pohlaví"
                value={selectedCandidate.gender}
              />

              <Info
                label="Město"
                value={selectedCandidate.city}
              />

              <Info
                label="Telefon"
                value={selectedCandidate.phone}
              />

              <Info
                label="E-mail"
                value={selectedCandidate.email}
              />

              <Info
                label="Role"
                value={selectedCandidate.role}
              />

              <Info
                label="Výška"
                value={
                  selectedCandidate.height_cm ??
                  selectedCandidate.height_centimetres
                    ? `${selectedCandidate.height_cm ?? selectedCandidate.height_centimetres} cm`
                    : ''
                }
              />

              <Info
                label="Zkušenosti"
                value={selectedCandidate.experience}
              />

              <Info
                label="Dostupnost"
                value={selectedCandidate.availability}
              />

              <Info
                label="Status"
                value={selectedCandidate.status}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CandidateCard({
  candidate,
  onClick,
}: {
  candidate: Candidate;
  onClick: () => void;
}) {
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    loadPhoto();
  }, [candidate.id]);

  async function loadPhoto() {
    const { data, error } = await supabase.storage
      .from('fotky-hercu')
      .list(candidate.id);

    if (error || !data) return;

    const file = data.find((item) => {
      const name = item.name.toLowerCase();

      return (
        name.endsWith('.jpg') ||
        name.endsWith('.jpeg') ||
        name.endsWith('.png') ||
        name.endsWith('.webp')
      );
    });

    if (!file) return;

    const { data: publicUrl } = supabase.storage
      .from('fotky-hercu')
      .getPublicUrl(`${candidate.id}/${file.name}`);

    setPhoto(publicUrl.publicUrl);
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: '#111',
        border: '1px solid #292929',
        borderRadius: '15px',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {photo ? (
        <img
          src={photo}
          alt={`${candidate.first_name || ''} ${
            candidate.last_name || ''
          }`}
          style={{
            width: '100%',
            height: '300px',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div
          style={{
            height: '300px',
            background: '#181818',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#777',
          }}
        >
          Bez fotografie
        </div>
      )}

      <div style={{ padding: '15px' }}>
        <h3 style={{ margin: '0 0 8px' }}>
          {candidate.first_name} {candidate.last_name}
        </h3>

        <p style={cardText}>
          Věk: {candidate.age || '-'}
        </p>

        <p style={cardText}>
          Město: {candidate.city || '-'}
        </p>

        <p style={cardText}>
          Role: {candidate.role || '-'}
        </p>

        <p
          style={{
            marginTop: '14px',
            fontWeight: 'bold',
          }}
        >
          Zobrazit detail →
        </p>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div
      style={{
        background: '#181818',
        border: '1px solid #292929',
        padding: '12px',
        borderRadius: '8px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          color: '#888',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontWeight: '500',
          wordBreak: 'break-word',
        }}
      >
        {value || '-'}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #444',
  background: '#181818',
  color: '#fff',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '10px 18px',
  borderRadius: '8px',
  border: '1px solid #444',
  background: '#fff',
  color: '#000',
  cursor: 'pointer',
  fontWeight: '600',
};

const cardText = {
  margin: '4px 0',
  color: '#aaa',
};
