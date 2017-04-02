import json
import path


ori_data_path = path.ori_data_path
current_data_path = r'data\current_X.csv'
ori_userid_path = r'UserInfo_Spider\userid_sample1.txt'
current_userid_path = r'data\current_userid.csv'
user_id_path = r'UserInfo_Spider\userid_sample1.txt'



def load_useridlist(userid_path):
    user_ids = []
    with open(userid_path, encoding='utf-8') as f:
        for line in f:
            user_ids.append(line.strip())
    return user_ids

def id2index(user_ids, userid_list):
    user_indexs = []
    for ids in userid_list:
        user_indexs.append(user_ids.index(ids))
    return user_indexs

def index2id(user_ids, userindexs_list):
    user_ids_new = []
    for index in userindexs_list:
        user_ids_new.append(user_ids[index])
    return user_ids_new


def update_current_X(user_list_json):
    user_indexs = []
    user_id_list = json.loads(user_list_json)["user_id"]
    user_ids = load_useridlist(user_id_path)
    user_indexs = id2index(user_ids, user_id_list)
    
    with open(ori_data_path, encoding='utf-8') as fin:
        with open(current_data_path, 'w', encoding='utf-8') as fout:
            i = -1
            for line in fin:
                i += 1
                if i in user_indexs:
                    fout.write(line)
                else:
                    continue

    with open(ori_userid_path, encoding='utf-8') as fin:
        with open(current_userid_path, 'w', encoding='utf-8') as fout:
            i = -1
            for line in fin:
                i += 1
                if i in user_indexs:
                    fout.write(line)
                else:
                    continue

    return len(user_id_list)


if __name__ == '__main__':
    print(update_current_X('{"user_id": ["338416", "711485", "576917"]}'))
    
