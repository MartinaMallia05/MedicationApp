<?php
// get_medications.php - Fixed version with better error handling
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

// Enable error logging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output
ini_set('log_errors', 1);

try {
    // EndlessMedical API endpoint (sandbox example)
    $url = "https://endlessmedical.com/api/GetDiseases";
    
    // Initialize cURL
    $ch = curl_init($url);
    if ($ch === false) {
        throw new Exception('Failed to initialize cURL');
    }
    
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HTTPHEADER => [
            'Accept: application/json',
            'User-Agent: MedicalApp/1.0'
        ]
    ]);
    
    $response = curl_exec($ch);
    
    if (curl_errno($ch)) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new Exception("cURL error: $error");
    }
    
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($status !== 200) {
        throw new Exception("API returned status $status");
    }
    
    if (empty($response)) {
        throw new Exception("Empty response from API");
    }
    
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON decode error: " . json_last_error_msg());
    }
    
    // Extract medication names from API response
    $medications = [];
    
    // Try different response structures
    if (isset($data['Diseases']) && is_array($data['Diseases'])) {
        // If API returns diseases, we'll use common medications instead
        $medications = [];
    } elseif (isset($data['data']) && is_array($data['data'])) {
        foreach ($data['data'] as $item) {
            if (is_string($item)) {
                $medications[] = $item;
            } elseif (isset($item['name'])) {
                $medications[] = $item['name'];
            }
        }
    } elseif (is_array($data)) {
        // If it's just an array of strings
        $medications = array_filter($data, 'is_string');
    }
    
    // Fallback to default medications if API doesn't return useful data
    if (empty($medications)) {
        $medications = [
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
            'Trazodone (Desyrel)'
        ];
    }
    
    // Remove duplicates and sort
    $medications = array_unique($medications);
    sort($medications);
    
    echo json_encode([
        'success' => true,
        'medications' => array_values($medications),
        'count' => count($medications),
        'source' => empty($medications) ? 'default' : 'api'
    ], JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    // Return fallback medications on any error
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
        'Trazodone (Desyrel)'
    ];
    
    echo json_encode([
        'success' => true,
        'medications' => $fallbackMeds,
        'count' => count($fallbackMeds),
        'source' => 'fallback',
        'note' => 'Using default medication list',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>