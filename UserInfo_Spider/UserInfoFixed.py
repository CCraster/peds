import urllib.request,re,os,json

with open("../static/data/test/user_info-4000.json", "r") as fp:
        user_info = json.load(fp)

for p in user_info:
    if user_info[p]:
        if not "badges" in list(user_info[p].keys()):
            user_info[p]["badges"] = {}

        if not "stat" in list(user_info[p].keys()):
            user_info[p]["stat"] = {}

        if not "total_tags" in list(user_info[p].keys()):
            user_info[p]["total_tags"] = {}

# array = list(user_info["338416"].keys())
# print(array)
# for p in user_info:
#     for q in array:
#         if not q in user_info[p]:
#             print(user_info[p])
#             break

with open("../static/data/user_info-4000.json", "w") as fs:
    json.dump(user_info, fs)