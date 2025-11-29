<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Fallback medication list
$fallbackMeds = [
    'Acetaminophen (Tylenol)',
    'Amoxicillin',
    'Aspirin',
    'Atorvastatin (Lipitor)',
    'Azithromycin (Zithromax)',
    'Ciprofloxacin (Cipro)',
    'Clopidogrel (Plavix)',
    'Ibuprofen (Advil, Motrin)',
    'Levothyroxine (Synthroid)',
    'Lisinopril (Prinivil, Zestril)',
    'Losartan (Cozaar)',
    'Metformin (Glucophage)',
    'Metoprolol (Lopressor, Toprol)',
    'Omeprazole (Prilosec)',
    'Pantoprazole (Protonix)',
    'Sertraline (Zoloft)',
    'Simvastatin (Zocor)',
    'Warfarin (Coumadin)',
    'Albuterol (Ventolin, ProAir)',
    'Gabapentin (Neurontin)',
    'Hydrochlorothiazide (HCTZ)',
    'Montelukast (Singulair)',
    'Prednisone',
    'Tramadol (Ultram)',
    'Trazodone (Desyrel)',
    'Amlodipine (Norvasc)',
    'Furosemide (Lasix)',
    'Metronidazole (Flagyl)',
    'Doxycycline',
    'Cephalexin (Keflex)',
    'Fluoxetine (Prozac)',
    'Hydrocodone (Vicodin)',
    'Insulin',
    'Lorazepam (Ativan)',
    'Meloxicam (Mobic)',
    'Naproxen (Aleve)',
    'Oxycodone',
    'Pantoprazole',
    'Pravastatin',
    'Propranolol',
    'Rosuvastatin (Crestor)',
    'Tamsulosin (Flomax)',
    'Venlafaxine (Effexor)',
    'Zolpidem (Ambien)',
    'Alprazolam (Xanax)',
    'Carvedilol (Coreg)',
    'Duloxetine (Cymbalta)',
    'Escitalopram (Lexapro)',
    'Finasteride (Propecia)'
];

try {
    // Try EndlessMedical API first
    $apiUrls = [
        'https://endlessmedical.com/api/diseases',
        'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search?terms=&maxList=50' // Fallback API
    ];
    
    $apiData = null;
    
    // Attempt to fetch from each API until one succeeds
    foreach ($apiUrls as $apiUrl) {
        try {
            $context = stream_context_create([
                'http' => [
                    'method' => 'GET',
                    'header' => [
                        'Accept: application/json',
                        'User-Agent: MedicalApp/1.0'
                    ],
                    'timeout' => 5,
                    'ignore_errors' => true
                ],
                'ssl' => [
                    'verify_peer' => false,
                    'verify_peer_name' => false
                ]
            ]);
            
            // Fetch data from API
            $response = @file_get_contents($apiUrl, false, $context);
            
            if ($response !== false) {
                $data = json_decode($response, true);
                
                if (json_last_error() === JSON_ERROR_NONE && !empty($data)) {
                    // Try to extract medication names from various API response structures
                    if (isset($data[3]) && is_array($data[3])) {
                        $apiData = array_slice($data[3], 0, 50);
                        break;
                    } elseif (isset($data['diseases']) && is_array($data['diseases'])) {
                        $apiData = array_slice($data['diseases'], 0, 50);
                        break;
                    } elseif (is_array($data)) {
                        $apiData = array_slice($data, 0, 50);
                        break;
                    }
                }
            }
        } catch (Exception $e) {
            continue; 
        }
    }
    
    if (!empty($apiData)) {
        echo json_encode([
            'success' => true,
            'medications' => $apiData,
            'count' => count($apiData),
            'source' => 'api'
        ]);
        exit;
    }
    
    // If APIs fail use fallback
    throw new Exception('API unavailable');
    
} catch (Exception $e) {
    // Return fallback medications
    echo json_encode([
        'success' => true,
        'medications' => $fallbackMeds,
        'count' => count($fallbackMeds),
        'source' => 'fallback',
        'note' => 'Using default medication list'
    ]);
}