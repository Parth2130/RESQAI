import React, { useState } from 'react';
import { 
  Activity, 
  Waves, 
  Flame, 
  Wind, 
  Thermometer, 
  Mountain, 
  Zap, 
  Briefcase, 
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

const PREPAREDNESS_DATA = [
  {
    id: 'earthquake',
    title: 'Earthquake Safety',
    icon: Activity,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    subtitle: 'Seismic tremors, structural shaking & secondary aftershocks',
    before: [
      'Fasten heavy shelves and ceiling fixtures securely to structural walls.',
      'Identify safe spots in each room: under sturdy desks, interior load-bearing walls.',
      'Know where and how to shut off main gas valves and electricity meters.',
      'Keep an emergency Go-Bag with first aid, torch, and radio accessible near the exit.',
      'Participate in building and community mock evacuation drills.'
    ],
    during: [
      'DROP to the ground immediately. COVER under a sturdy table or desk. HOLD ON until shaking stops.',
      'If in bed, stay there and protect your head and neck with a pillow.',
      'Stay away from glass windows, exterior doors, tall bookcases, and masonry.',
      'DO NOT use elevators or rush toward congested stairwells during active shaking.',
      'If outdoors, move to an open area clear of power lines, poles, flyovers, and hoardings.'
    ],
    after: [
      'Check yourself and family members for injuries; administer basic first aid.',
      'Inspect your residence for gas leaks (smell) or damaged electrical lines. Do NOT light matches.',
      'Expect aftershocks. Be prepared to Drop, Cover, and Hold on again.',
      'Tune into official radio broadcasts or verified NDMA channels for updates.',
      'Avoid driving near bridges, ramps, or cracked masonry.'
    ],
    precautions: [
      'Never run outside while shaking is occurring—falling glass and roof tiles are the primary cause of injury.',
      'Do not touch downed power lines or objects in contact with them.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Earthquakes'
  },
  {
    id: 'flood',
    title: 'Flood & Heavy Rainfall',
    icon: Waves,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    subtitle: 'Flash floods, overflowing riverbanks, and monsoon waterlogging',
    before: [
      'Know your local flood risk and elevation relative to streams and nullahs.',
      'Seal important documents (Aadhaar, property deeds, insurance) in watertight zip pouches.',
      'Clear storm drains around your home and elevate sensitive electrical appliances.',
      'Stock clean drinking water and non-perishable rations for at least 3 days.',
      'Identify the route to the nearest designated high-elevation municipal shelter.'
    ],
    during: [
      'Turn off main electricity switch and gas supply before water enters your premises.',
      'Move to upper floors or high ground. Do not wait for water to block ground exits.',
      'NEVER attempt to walk, swim, or drive through moving water. 6 inches of moving water can sweep an adult.',
      'Avoid floodwaters that may be electrically charged from submerged wires or contaminated by sewage.',
      'Do not drink floodwater; boil tap water or use purification chlorine tablets.'
    ],
    after: [
      'Return home only after authorities declare it safe. Watch for structural wall cracks.',
      'Do not turn on electrical appliances until certified dry and safe by an electrician.',
      'Disinfect all items that came into contact with floodwater to prevent leptospirosis and cholera.',
      'Photograph property damage for insurance and government disaster relief documentation.',
      'Clear stagnant water around living quarters to prevent dengue and malaria breeding.'
    ],
    precautions: [
      'Vehicles can float in as little as 12 inches of water. Avoid waterlogged underpasses.',
      'Keep children away from drains and fast-moving roadside gutters.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Floods'
  },
  {
    id: 'cyclone',
    title: 'Cyclone & Gale Winds',
    icon: Wind,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    subtitle: 'High-velocity storm surges, coastal gales & torrential rainfall',
    before: [
      'Inspect roofs, tie down loose metal sheets, and trim dead tree branches near power lines.',
      'Board up or tape glass windows with heavy crisscross adhesive tape to prevent flying shards.',
      'Keep battery-operated emergency transceivers, fully charged power banks, and torches ready.',
      'Fishermen must strictly heed IMD alerts and not venture into deep sea or coastal waters.',
      'Evacuate immediately if residing in kuccha dwellings or within the designated coastal surge zone.'
    ],
    during: [
      'Remain indoors in the strongest part of the house, away from windows and skylights.',
      'Beware of the "Eye of the Cyclone": a sudden calm does NOT mean the storm is over; winds will reverse violently.',
      'Unplug non-essential electronic equipment to protect against high voltage surges.',
      'Keep doors and windows firmly shut on the windward side.',
      'Do not venture outside to inspect damage until the all-clear is officially broadcast.'
    ],
    after: [
      'Avoid loose or dangling electrical wires; report them to the local municipal power board.',
      'Watch out for displaced snakes, scorpions, and reptiles driven into homes by storm waters.',
      'Drink only boiled or chemically disinfected water.',
      'Assist elderly neighbors and vulnerable persons with clean food and medical kits.'
    ],
    precautions: [
      'Never spread unverified WhatsApp rumors during a cyclone. Rely strictly on IMD & NDMA bulletins.',
      'Do not touch metal poles, transformers, or wet fencing.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Cyclones'
  },
  {
    id: 'fire',
    title: 'Building & Wildfires',
    icon: Flame,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    subtitle: 'Structural blazes, electrical short-circuits & forest fires',
    before: [
      'Install smoke alarms and ensure fire extinguishers (ABC dry powder) are present on each floor.',
      'Plan and practice two distinct escape routes from every room in your home or office.',
      'Never overload multi-plug electrical sockets with high-wattage appliances.',
      'Keep flammable chemicals, thinners, and LPG cylinders in well-ventilated, secure locations.'
    ],
    during: [
      'Pull the nearest fire alarm and shout to alert all occupants immediately.',
      'Crawl low under smoke: clean, breathable air is located near the floor (within 30 cm).',
      'Test door handles with the back of your hand before opening. If hot, DO NOT open—use an alternate exit.',
      'If your clothes catch fire: STOP, DROP, and ROLL until flames are smothered.',
      'NEVER use elevators during a structural fire; use fire-rated enclosed emergency staircases.'
    ],
    after: [
      'Once outside, STAY OUT. Never re-enter a burning structure for possessions or pets.',
      'Cool minor burns with cool, running water for 10-15 minutes. Do not apply butter or toothpaste.',
      'Direct incoming fire brigade personnel to known water hydrants and trapped individuals.'
    ],
    precautions: [
      'Do not attempt to extinguish a rapidly spreading fire with water if electrical equipment is involved.',
      'Keep fire egress corridors completely clear of discarded furniture and boxes.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Fires'
  },
  {
    id: 'heatwave',
    title: 'Extreme Heatwave',
    icon: Thermometer,
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
    subtitle: 'Severe summer temperatures exceeding 45°C & heatstroke risks',
    before: [
      'Monitor local meteorological heat advisories (Yellow, Orange, Red alerts).',
      'Keep oral rehydration salts (ORS), lemon water, and buttermilk readily available at home.',
      'Use curtains, blinds, and reflective shades to block direct sunlight on western windows.'
    ],
    during: [
      'Avoid going out between 11:00 AM and 4:00 PM when solar radiation is most intense.',
      'Drink plenty of water even if you do not feel thirsty. Avoid alcohol, tea, and carbonated soft drinks.',
      'Wear lightweight, loose, light-colored cotton clothing and cover your head with a cloth or umbrella.',
      'Never leave children, infants, or pets locked inside a parked vehicle, even for a few minutes.',
      'Recognize heatstroke symptoms: high body temperature, confusion, nausea, rapid pulse, fainting.'
    ],
    after: [
      'If heatstroke is suspected, move the victim to a cool, shaded area immediately.',
      'Sponge the body with cool water and apply ice packs to the neck, armpits, and groin.',
      'Call emergency 108 / 112 immediately for emergency medical transport.'
    ],
    precautions: [
      'Outdoor laborers must schedule heavy exertion during early mornings or late evenings.',
      'Ensure adequate water pots and shade for domestic animals and birds.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Heat-Wave'
  },
  {
    id: 'landslide',
    title: 'Landslides & Debris Flow',
    icon: Mountain,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    subtitle: 'Hill slope failures, rockfall hazards & ghat road blockages',
    before: [
      'Be aware of past landslide history in your mountainous or ghat sector.',
      'Watch for warning signs: tilting trees, cracks in hill slopes, or muddy springs suddenly appearing.',
      'Construct retaining walls and avoid excavating the toe of steep hillside contours.',
      'Evacuate immediately during prolonged heavy rainfall if located along known slide gullies.'
    ],
    during: [
      'Stay alert while driving in hilly terrain; watch for fallen rocks, mud on pavement, and road fractures.',
      'If you suspect imminent slide movement, evacuate uphill immediately, away from the path of the debris.',
      'If trapped indoors with no exit, curl into a tight ball under a sturdy table to protect your head.'
    ],
    after: [
      'Stay away from the slide area. Secondary and tertiary slides often follow initial failures.',
      'Report damaged roads, broken power lines, and buried culverts to local authorities immediately.',
      'Check for injured persons without entering the active slide danger zone.'
    ],
    precautions: [
      'Never build homes on steep natural runoff channels or ravine bottoms.',
      'Avoid traveling on vulnerable ghat routes at night during peak monsoon seasons.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Landslides'
  },
  {
    id: 'lightning',
    title: 'Lightning & Thunderstorms',
    icon: Zap,
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    subtitle: 'High-voltage cloud-to-ground strikes & sudden severe squalls',
    before: [
      'Follow the 30/30 Rule: If time between lightning flash and thunder is less than 30 seconds, go indoors.',
      'Install lightning arresters on tall residential and agricultural buildings.',
      'Avoid planning open-field sports or outdoor farm work when thunderstorm warnings are active.'
    ],
    during: [
      'Seek shelter in a substantial, enclosed building or metal-topped motor vehicle.',
      'NEVER take shelter under isolated tall trees, metal sheds, or open pavilions.',
      'If caught in an open field: Crouch down on the balls of your feet with hands on knees. DO NOT lie flat.',
      'Unplug computers, televisions, and electrical appliances. Avoid using corded landline phones.',
      'Stay away from plumbing fixtures, metal pipes, sinks, and bathtubs.'
    ],
    after: [
      'Lightning victims do NOT carry an electrical charge—administer CPR and first aid immediately.',
      'Wait at least 30 minutes after the last thunderclap before resuming outdoor activities.'
    ],
    precautions: [
      'Water bodies are extremely dangerous during storms. Evacuate lakes, rivers, and swimming pools instantly.',
      'Do not hold metal umbrellas, fishing rods, or agricultural tools during lightning.'
    ],
    officialLink: 'https://ndma.gov.in/Natural-Hazards/Thunderstorm-Lightning'
  },
  {
    id: 'gobag',
    title: '72-Hour Emergency Go-Bag Kit',
    icon: Briefcase,
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    subtitle: 'Essential survival kit checklist to sustain your household for 3 days',
    before: [
      'Drinking Water: 3-4 liters per person per day for drinking and sanitation.',
      'Non-Perishable Food: Ready-to-eat energy bars, dry fruits, biscuits, roasted gram (chana).',
      'First Aid Kit: Bandages, antiseptic liquid (Betadine), sterile gauze, burn cream, ORS packets, personal prescription medicines.',
      'Emergency Tools: LED torch with spare batteries, whistle (for signaling under debris), multi-tool pocket knife, matches in waterproof container.',
      'Important Documents: Certified photocopies of Aadhaar, passports, property records, bank books, medical prescriptions sealed in zip bags.',
      'Hygiene & Sanitation: Soap, hand sanitizer, sanitary napkins, wet wipes, dust masks (N95).',
      'Cash: Small currency notes (ATMs and UPI payment terminals frequently fail during power blackouts).'
    ],
    during: [
      'Keep the Go-Bag stored near your main exit door where it can be grabbed in under 15 seconds.',
      'Each able-bodied family member should know where the bag is located and how to carry it.',
      'Add emergency warm clothing, rain poncho, and sturdy shoes.'
    ],
    after: [
      'Inspect and refresh your Go-Bag every 6 months: replace expired food, medicines, and discharged batteries.',
      'Adjust contents for seasonal changes (e.g., extra blankets in winter, mosquito repellents in monsoon).'
    ],
    precautions: [
      'Do not make the bag too heavy to carry comfortably for at least 3 kilometers on foot.',
      'Ensure a separate, clearly labeled emergency kit exists in your vehicle boot.'
    ],
    officialLink: 'https://ndma.gov.in/Capacity-Building/IEC'
  }
];

export default function PreparednessPage() {
  const [selectedId, setSelectedId] = useState('earthquake');
  const selectedDisaster = PREPAREDNESS_DATA.find(d => d.id === selectedId) || PREPAREDNESS_DATA[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-pastel-border">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Safety Center & Preparedness Manual
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-[#5278E8] border border-indigo-200">
              NDMA STANDARDS
            </span>
          </div>
          <p className="text-xs text-pastel-muted">
            Science-backed disaster response protocols, survival checklists, and Before/During/After action manuals.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Verified against NDMA & NDRF guidelines</span>
        </div>
      </div>

      {/* 8 Categories Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {PREPAREDNESS_DATA.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedId(cat.id)}
              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-1.5 ${
                isSelected
                  ? 'border-[#5278E8] bg-indigo-50/60 shadow-soft ring-2 ring-indigo-200'
                  : 'border-pastel-border bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isSelected ? 'bg-[#5278E8] text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[11px] font-bold leading-tight ${
                isSelected ? 'text-[#5278E8]' : 'text-slate-700'
              }`}>
                {cat.title.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Disaster Manual View */}
      <div className="pastel-card p-6 sm:p-10 space-y-8 shadow-soft-lg border-indigo-100">
        {/* Manual Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-pastel-border gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5278E8] to-[#A5B4FC] text-white flex items-center justify-center shadow-soft">
              <selectedDisaster.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {selectedDisaster.title}
                </h2>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${selectedDisaster.badgeColor}`}>
                  NDMA PROTOCOL
                </span>
              </div>
              <p className="text-xs text-pastel-muted mt-0.5">{selectedDisaster.subtitle}</p>
            </div>
          </div>

          <a
            href={selectedDisaster.officialLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-pastel-border text-xs font-semibold text-slate-700 hover:text-[#5278E8] transition self-start sm:self-auto"
          >
            <span>NDMA Official Guide</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>

        {/* 3 Step Action Grid (Before, During, After) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phase 1: BEFORE */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-pastel-border space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-200">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
                Before: Prevention & Preparedness
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-700">
              {selectedDisaster.before.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 2: DURING */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-amber-200">
              <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 font-extrabold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-extrabold text-amber-950 text-sm uppercase tracking-wider">
                During: Immediate Life Safety Action
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-amber-950 font-medium">
              {selectedDisaster.during.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 3: AFTER */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-emerald-200">
              <span className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-900 font-extrabold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-extrabold text-emerald-950 text-sm uppercase tracking-wider">
                After: Recovery & Relief
              </h3>
            </div>
            <ul className="space-y-2.5 text-xs text-emerald-950">
              {selectedDisaster.after.map((item, idx) => (
                <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Vital Precautions Strip */}
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
          <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Critical Avoidance Mistakes:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-rose-950 font-medium">
            {selectedDisaster.precautions?.map((p, idx) => (
              <div key={idx} className="flex items-start space-x-1.5">
                <span className="text-rose-600 font-bold">•</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
