import json
from datetime import datetime
from colorama import init, Fore, Style

init(autoreset=True)

# mapping فارسی به انگلیسی برای نمایش ترمینال
DAY_MAP = {
    'شنبه':'Saturday',
    'یکشنبه':'Sunday',
    'دوشنبه':'Monday',
    'سه‌شنبه':'Tuesday',
    'چهارشنبه':'Wednesday',
    'پنج‌شنبه':'Thursday',
    'جمعه':'Friday',
    'متفرقه':'Misc'
}

DAYS_FARSI = list(DAY_MAP.keys())

def main():
    tasks = []
    print(Fore.CYAN + Style.BRIGHT + "=== 904 Homework JSON Generator ===")
    while True:
        day_input = input(Fore.YELLOW + f"Enter the day ({'/'.join([DAY_MAP[d] for d in DAYS_FARSI])}), or press Enter to finish: ")
        if day_input.strip() == '':
            break
        # تبدیل ورودی انگلیسی به فارسی
        farsi_day = None
        for fa, en in DAY_MAP.items():
            if day_input.lower() == en.lower():
                farsi_day = fa
                break
        if farsi_day is None:
            print(Fore.RED + "Invalid day, please try again.")
            continue
        title = input(Fore.GREEN + "Enter the task title: ")
        print(Fore.MAGENTA + "Enter task description (empty line to finish):")
        description_lines = []
        while True:
            line = input()
            if line.strip() == '':
                break
            description_lines.append(line)
        description = '\n'.join(description_lines)
        tasks.append({
            'day': farsi_day,
            'title': title,
            'description': description,
            'date': datetime.now().strftime('%Y-%m-%d')
        })
        print(Fore.BLUE + f"Task for {day_input} added!\n")

    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(tasks, f, ensure_ascii=False, indent=2)

    print(Fore.CYAN + Style.BRIGHT + "\nAll tasks saved to data.json!")

if __name__ == '__main__':
    main()
