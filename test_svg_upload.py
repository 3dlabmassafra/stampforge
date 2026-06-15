import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--disable-gpu')
# Imposta capabilities per loghi
chrome_options.set_capability('goog:loggingPrefs', {'browser': 'ALL'})

driver = webdriver.Chrome(options=chrome_options)
try:
    driver.get('http://localhost:8000')
    time.sleep(2)
    
    # Crea un file SVG temporaneo per il test
    with open('test_logo.svg', 'w') as f:
        f.write('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" /></svg>')
        
    import os
    abs_path = os.path.abspath('test_logo.svg')
    
    # Trova l'input file e carica l'SVG
    file_input = driver.find_element("id", "svg-input")
    file_input.send_keys(abs_path)
    time.sleep(2)
    
    # Ottieni i log della console
    logs = driver.get_log('browser')
    for log in logs:
        print(log['level'], log['message'])
finally:
    driver.quit()
