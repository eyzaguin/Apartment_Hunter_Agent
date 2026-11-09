import React, { useState } from 'react';

// Full initial dataset matching the user's criteria
const INITIAL_LISTINGS = [
  {
    id: 1,
    title: "Sunny 1BR Near Subway & Parks",
    address: "450 W 42nd St, New York, NY",
    price: 2450,
    sqft: 650,
    beds: 1,
    baths: 1,
    commuteTimeMin: 18,
    petPolicy: "Cats & Small Dogs allowed ($50/mo pet rent)",
    description: "Charming south-facing unit with hardwood floors, natural light, and modern stainless steel appliances. Located 2 blocks from the subway station.",
    redFlags: ["Broker fee applies (15%)", "Fifth floor walk-up (no elevator)"],
    score: 94,
    matchReason: "Exceptional commute time and price point match your budget with pet-friendly terms."
  },
  {
    id: 2,
    title: "Modern Studio with In-Unit Laundry",
    address: "120 E 34th St, New York, NY",
    price: 2300,
    sqft: 500,
    beds: 0,
    baths: 1,
    commuteTimeMin: 22,
    petPolicy: "Cats only. No dogs permitted.",
    description: "Sleek studio apartment featuring floor-to-ceiling windows, in-unit washer/dryer, and central AC.",
    redFlags: ["Small square footage for price", "Strict no-dog policy"],
    score: 88,
    matchReason: "Great doorman security and in-unit laundry, though slightly tighter on square footage."
  },
  {
    id: 3,
    title: "Spacious 2BR Loft with Balcony",
    address: "88 Grand St, Brooklyn, NY",
    price: 2800,
    sqft: 950,
    beds: 2,
    baths: 1.5,
    commuteTimeMin: 35,
    petPolicy: "Pets welcome! No weight limit or extra pet deposit.",
    description: "Massive open-concept loft with exposed brick walls, private balcony, and dishwasher.",
    redFlags: ["Commute exceeds your 30-minute target", "Slightly over maximum budget"],
    score: 81,
    matchReason: "Incredible space and fantastic pet policy, though commute is 5 minutes longer than desired."
  }
];

export default function ApartmentHunterApp() {
  // User Criteria State
  const [budget, setBudget] = useState(2600);
  const [location, setLocation] = useState("Downtown Hub / Midtown");
  const [commuteMax, setCommuteMax] = useState(30);
  const [pets, setPets] = useState(true);
  const [customPickyRule, setCustomPickyRule] = useState("Must have elevator or be 1st/2nd floor");
  
  // Agent State
  const [agentState, setAgentState] = useState("IDLE");
  const [logs, setLogs] = useState([]);
  const [shortlist, setShortlist] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  const addLog = (step, title, details) => {
    setLogs(prev => [...prev, { id: Date.now() + Math.random(), step, title, details, time: new Date().toLocaleTimeString() }]);
  };

  const runAgent = async () => {
    setAgentState("RUNNING");
    setLogs([]);
    setShortlist([]);
    setActiveTab("console");

    // Tool 1: Search Listings
    addLog(1, "Calling Tool: search_listings", { location, budgetMax: budget, petsRequired: pets });
    await new Promise(r => setTimeout(r, 600));
    addLog(1, "Tool Output: search_listings", `Found ${INITIAL_LISTINGS.length} raw matching properties.`);

    // Tool 2: Calculate Commute
    addLog(2, "Calling Tool: calculate_commute", { destination: location, maxCommute: commuteMax });
    await new Promise(r => setTimeout(r, 700));
    addLog(2, "Tool Output: calculate_commute", "Transit times verified via GTFS timetable simulation.");

    // Tool 3: Analyze Description & Red Flags
    addLog(3, "Calling Tool: analyze_listing_description", { pickyRule: customPickyRule });
    await new Promise(r => setTimeout(r, 700));
    addLog(3, "Tool Output: analyze_listing_description", "Scanned fine print for broker fees, stairs, and pet restrictions.");

    // Tool 4: Score & Rank
    addLog(4, "Calling Tool: score_and_rank_apartments", { weighting: "Commute (40%), Budget (30%), Pets/Rules (30%)" });
    await new Promise(r => setTimeout(r, 500));

    const scored = INITIAL_LISTINGS.map(item => {
      let penalty = 0;
      let notes = item.matchReason;
      if (item.commuteTimeMin > commuteMax) {
        penalty += 15;
        notes += ` Note: Commute is ${item.commuteTimeMin}m (exceeds ${commuteMax}m target).`;
      }
      if (item.price > budget) {
        penalty += 10;
        notes += ` Note: Price is $${item.price} (exceeds $${budget} budget).`;
      }
      return { ...item, finalScore: Math.max(50, item.score - penalty), dynamicNotes: notes };
    }).sort((a, b) => b.finalScore - a.finalScore);

    setShortlist(scored);
    setAgentState("COMPLETED");
    addLog(4, "Agent Finished", `Successfully generated ranked shortlist of ${scored.length} top apartments.`);
    setActiveTab("shortlist");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, sans-serif', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center', backgroundColor: '#ffffff', padding: '16px 24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>🏢 Apartment Hunter Agent</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Autonomous Multi-Tool Search & Red Flag Scanner</p>
        </div>
        <div>
          <button onClick={() => setActiveTab('dashboard')} style={{ marginRight: '8px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: activeTab === 'dashboard' ? '#2563eb' : '#fff', color: activeTab === 'dashboard' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Criteria & Controls</button>
          <button onClick={() => setActiveTab('console')} style={{ marginRight: '8px', padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: activeTab === 'console' ? '#2563eb' : '#fff', color: activeTab === 'console' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Reasoning Trace ({logs.length})</button>
          <button onClick={() => setActiveTab('shortlist')} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: activeTab === 'shortlist' ? '#2563eb' : '#fff', color: activeTab === 'shortlist' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}>Ranked Shortlist ({shortlist.length})</button>
        </div>
      </header>

      {activeTab === 'dashboard' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>🎯 Define Your Preferences</h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Max Monthly Budget ($): ${budget}</label>
              <input type="range" min="1500" max="4500" step="100" value={budget} onChange={e => setBudget(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Target Location / Work Hub</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Max Commute Time: {commuteMax} minutes</label>
              <input type="range" min="10" max="60" step="5" value={commuteMax} onChange={e => setCommuteMax(Number(e.target.value))} style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" id="petsCheck" checked={pets} onChange={e => setPets(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#2563eb' }} />
              <label htmlFor="petsCheck" style={{ fontSize: '14px', fontWeight: '500' }}>Must be Pet Friendly</label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Custom Picky Rule (NLP Agent Flag)</label>
              <input type="text" value={customPickyRule} onChange={e => setCustomPickyRule(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' }} />
            </div>

            <button onClick={runAgent} disabled={agentState === 'RUNNING'} style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
              {agentState === 'RUNNING' ? '🤖 Agent Running Multi-Tool Pipeline...' : '🚀 Run Apartment Hunter Agent'}
            </button>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>⚙️ Active Agent Toolset</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #2563eb' }}>
                  <strong>1. search_listings()</strong>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>Queries real-time web listings matching geography & price.</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
                  <strong>2. calculate_commute()</strong>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>Simulates public transit directions to your designated work hub.</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #f59e0b' }}>
                  <strong>3. analyze_listing_description()</strong>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>Scans fine print for broker fees, stairs, and your custom picky rule.</p>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', borderLeft: '4px solid #8b5cf6' }}>
                  <strong>4. score_and_rank_apartments()</strong>
                  <p style={{ fontSize: '13px', color: '#475569', margin: '4px 0 0' }}>Weights all criteria to compile your personalized top shortlist.</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af' }}>
              💡 <strong>Zero API Key Required:</strong> Runs completely client-side with simulated tool calls and real-time reasoning traces.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'console' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>🧠 Live Agent Reasoning Trace</h2>
            <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '9999px', backgroundColor: agentState === 'RUNNING' ? '#fef3c7' : '#dcfce7', color: agentState === 'RUNNING' ? '#92400e' : '#166534', fontWeight: 'bold' }}>{agentState}</span>
          </div>
          {logs.map(l => (
            <div key={l.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <strong style={{ color: '#2563eb', fontSize: '13px' }}>Step {l.step}: {l.title}</strong>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{l.time}</span>
              </div>
              <pre style={{ fontSize: '12px', backgroundColor: '#0f172a', color: '#f8fafc', padding: '10px', borderRadius: '6px', overflowX: 'auto', margin: 0 }}>
                {typeof l.details === 'object' ? JSON.stringify(l.details, null, 2) : l.details}
              </pre>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'shortlist' && (
        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>🏆 Ranked Shortlist Results ({shortlist.length})</h2>
            <button onClick={() => setActiveTab('dashboard')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontSize: '13px', cursor: 'pointer' }}>Adjust Criteria</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {shortlist.map((item, idx) => (
              <div key={item.id} style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#2563eb', width: '28px', height: '28px', borderRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>#{idx + 1}</span>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{item.title}</h3>
                  <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold' }}>Score: {item.finalScore}/100</span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 8px' }}>📍 {item.address} | 💰 <strong>${item.price}/mo</strong> | 🚇 {item.commuteTimeMin} min commute</p>
                <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 12px' }}>{item.description}</p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>🐕 {item.petPolicy}</span>
                  <span style={{ fontSize: '12px', backgroundColor: '#e2e8f0', padding: '4px 8px', borderRadius: '6px' }}>📐 {item.sqft} sqft ({item.beds} bed / {item.baths} bath)</span>
                </div>
                {item.redFlags && (
                  <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '10px', borderRadius: '8px', fontSize: '13px', color: '#991b1b', marginBottom: '8px' }}>
                    <strong>🚩 Agent Flagged Red Flags:</strong>
                    <ul style={{ margin: '4px 0 0 20px', padding: 0 }}>
                      {item.redFlags.map((rf, rfi) => <li key={rfi}>{rf}</li>)}
                    </ul>
                  </div>
                )}
                <div style={{ fontSize: '13px', color: '#047857', backgroundColor: '#ecfdf5', padding: '8px 12px', borderRadius: '6px' }}>
                  🤖 <strong>Match Analysis:</strong> {item.dynamicNotes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}