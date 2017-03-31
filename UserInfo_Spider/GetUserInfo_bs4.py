import urllib.request,re,json,time

from bs4 import BeautifulSoup

# with open("D://Program Files (x86)//Workspaces//GitHub//PySpider//02_DisguiseBrowser_217408.html", "rb") as fs:
#     data = fs.read()
def main():
	# with open("userid_sample1.txt", "r") as fs:
	# 	data = []
	# 	line = fs.readline()
	# 	while line:
	# 		data.append(int(line))
	# 		line = fs.readline()
	# 	with open("userid_sample.json", "w") as fs:
	# 		json.dump(data, fs)
	with open("userid_sample.json", "r") as fs:
		user_id = json.load(fs)
	with open("../static/data/user_info.json", "r") as fp:
		user_info = json.load(fp)

	headers = {'User-Agent':'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:51.0) Gecko/20100101 Firefox/51.0'  
	                        'Chrome/51.0.2704.63 Safari/537.36'}

	user_id_length = len(user_id)
	for i in range(user_id_length):
		uuid = user_id[i]
		if str(uuid) in user_info:
			print(uuid)
			continue
		url = "http://stackoverflow.com/users/" + str(uuid)
		req = urllib.request.Request(url=url, headers=headers)
		try:
			res = urllib.request.urlopen(req)
		except urllib.error.HTTPError as e:
			if e.code == 429:
				print("[%s]: IP can not get page!!!" % i)
				with open("../static/data/user_info.json", "w") as fs:
					json.dump(user_info, fs)
				time.sleep(600)
				res = urllib.request.urlopen(req)
			else:
				user_info[uuid] = {}
				print("[%s/%s]: %s is %s" % (i, user_id_length, uuid, e.code))
				# with open("../static/data/user_info.json", "w") as fs:
				# 	json.dump(user_info, fs)
				continue
		data = res.read()
		data = data.decode('utf-8')

		soup = BeautifulSoup(data, "lxml")
		user_info[uuid] = {}
		'''
			part 1
		'''
		str_userName = soup.find("title").get_text()
		str_userName = str_userName[5:len(str_userName)-17]
		user_info[uuid]["user_name"] = str_userName

		str_reputation = soup.find(title="reputation").get_text()
		str_reputation = str_reputation[9:len(str_reputation)-12]
		user_info[uuid]["reputation"] = get_num(str_reputation)

		str_badges = soup.find_all("span", class_= re.compile("badge\d-alternate"), title=re.compile(".*?badge[s]?"))
		if(len(str_badges) > 0):
			badges = {}
			for j in range(len(str_badges)):
				temp = str_badges[j]["title"].split(" ")
				badges[temp[1]] = get_num(temp[0])
			user_info[uuid]["badges"] = badges

		'''
			part 2 待改进
		'''
		str_about = soup.find(class_="bio").get_text()
		if len(str_about) == 0:
			str_about = "Apparently, this user prefers to keep an air of mystery about them."
		user_info[uuid]["about"] = string_beautify(str_about)

		'''
			part 3 
		'''
		str_stat = soup.find_all(class_=re.compile("stat .*? col-\d"))
		if len(str_stat) > 0:
			stat = {}
			for j in range(len(str_stat)):
				str_stat[j] = str_stat[j].find(class_="number").get_text()
				# str_stat[i] = re.findall(re.compile(r'\n(.*?)\n                    ', re.DOTALL), str_stat[i].get_text())
			stat["answers"] = get_num(str_stat[0])
			stat["questions"] = get_num(str_stat[1])
			stat["people reached"] = get_num(str_stat[2])
			user_info[uuid]["stat"] = stat

		str_userLinks = soup.find_all("span", class_=re.compile("icon-[^ht].*?"))
		user_links = {}
		for j in range(len(str_userLinks)):
			parent = str_userLinks[j].find_parent("li") 
			if(parent):
				if str_userLinks[j]["class"][0] == "icon-eye":
					user_links[str_userLinks[j]["class"][0]] = get_num(parent.get_text(strip=True).split(" ")[0])
				else:
					user_links[str_userLinks[j]["class"][0]] = parent.get_text(strip=True)
		str_userLinks_history = soup.find("span", class_=re.compile("icon-[h].*?"))
		next_sibling_history = str_userLinks_history.find_next_sibling("span")
		user_links["icon-history"] = next_sibling_history["title"]
		user_info[uuid]["user_links"] = user_links

		'''
			part 4
		'''
		str_totalTags = soup.find(class_="title-section no-border")
		if str_totalTags:
			str_totalTags = str_totalTags.get_text()
			str_totalTags = str_totalTags[10:len(str_totalTags)-1]
			user_info[uuid]["total_tags"] = get_num(str_totalTags)

		str_topTags_1 = soup.find_all(class_="col col-12")
		top_tags = {"first":{}, "second":{}}
		if str_topTags_1:
			str_topTags_1 = str_topTags_1[0].get_text(strip=True)
			first_name = str_topTags_1.split("Score")[0]
			top_tags["first"][first_name] = {}
			top_tags["first"][first_name]["Score"] = get_num(str_topTags_1.split("Posts")[0].split("Score")[1])
			top_tags["first"][first_name]["Posts"] = get_num(str_topTags_1.split("Posts")[1])
			top_tags["first"][first_name]["Posts%"] = get_num(str_topTags_1.split("%")[1])
		str_topTags_2 = soup.find_all(class_=re.compile("col col-[6|4]"))
		if len(str_topTags_2) > 0:
			for j in range(len(str_topTags_2)):
				str_temp = str_topTags_2[j].get_text(strip=True)
				name = str_temp.split("Score")[0]
				top_tags["second"][name] = {}
				top_tags["second"][name]["Score"] = get_num(str_temp.split("Score")[1].split("Posts")[0])
				top_tags["second"][name]["Posts"] = get_num(str_temp.split("Posts")[1])
		user_info[uuid]["top_tags"] = top_tags

		'''
			part 5
		'''
		

		print("[%s/%s]: %s is finished" % (i, user_id_length, uuid))
		if(i % 100 == 0):
			with open("../static/data/test/user_info-" + str(i) + ".json", "w") as fs:
				json.dump(user_info, fs)
		if (i % 1000 == 0) or (i == user_id_length - 1):
			with open("../static/data/user_info.json", "w") as fs:
				json.dump(user_info, fs)
			with open("../static/data/test/user_info-" + str(i) + ".json", "w") as fp:
				json.dump(user_info, fp)

	# print(user_info[217406]["about"])
	# with open("../static/data/user_info.json", "w") as fs:
	# 	json.dump(user_info, fp)

def get_num(num):
	num = num.replace(",", "")
	num = num.replace("~", "")
	if num.find('k') >= 0:
		num = num.replace("k", "")
		num = int(float(num) * 1000)
	elif num.find('m') >= 0:
		num = num.replace("m", "")
		num = int(float(num) * 1000000)
	return int(num)

def string_beautify(str):
	while str[0] == "\n":
		str = str[1:len(str)]
		if len(str) == 0:
			str = "Apparently, this user prefers to keep an air of mystery about them."
	while str.find("\n\n") >= 0:
		str = str.replace("\n\n", "\n")
	return str


if __name__ == '__main__':
	main()