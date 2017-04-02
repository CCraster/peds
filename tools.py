from os import path, makedirs
from datetime import datetime
import numpy as np
from sklearn.datasets import load_svmlight_file
from scipy.sparse import hstack

work_path = path.abspath(path.pardir)
data_path = work_path + r'\data\2012'
src_path = work_path + r'\src'

# 构建工作目录
# if not path.exists(data_path):
#     makedirs(data_path)
#     temp_path = data_path+r'\temp'
#     result_path = data_path+r'\result'
#     makedirs(temp_path)
#     makedirs(result_path)

original_file_path = r'E:\ProgramData\SOdata\Stackoverflow Data Dump 2012'

def conbine_feature(path_fchange, path_ffix, path_output, path_ffix_feature_num):
    '''合并特征libsvm文件
        input:
            path_ffix_feature_num: fix文件的最大特征序号'''

    with open(path_output, 'w', encoding='utf-8') as outf:

        f_change = open(path_fchange, encoding='utf-8')
    
        with open(path_ffix, encoding='utf-8') as f:
            for fix_line in f:
                s = fix_line
    
                change_line = f_change.readline()
                change_lines = change_line.strip('\n').split(' ')
                
                # 如果add有特征再组合，否则直接输出fix的特特征
                if len(change_lines)>1:
                    s = s.strip('\n')
                    del change_lines[0]
                    for item in change_lines:
                        items = item.split(':')
                        num = str(int(items[0])+path_ffix_feature_num)
                        temp_s = ' '+ num +':'+ items[1]
                        s += temp_s
                    s += '\n'
                outf.write(s)
    
        f_change.close()

def conbine_features_to_dataset(path_features):
    X = list()
    Y = list()
    for path_feature in path_features:
        current_X, current_Y= load_svmlight_file(path_feature)
        X.append(current_X)
        Y = current_Y
    X1 = hstack(X).toarray()
    return X1, Y

def get_userinfo(ulist, user_num, pipe):
    '''
    通过id列表获得用户创建时间
    imput:
        ulist: 包含待计算用户的用户id的列表
        user_num: 待计算用户数量
    output:
        uInfo_list (creationDate +','+ reputation):包含用户信息的待计算用户列表
    '''
    for i in range(0, user_num):
        pipe.get('userInfo:' + ulist[i])

    uInfo_list = pipe.execute()
    return uInfo_list

def get_hash_userinfo(ulist, user_num, pipe):
    '''
    通过id列表获得用户创建时间
    imput:
        ulist: 包含待计算用户的用户id的列表
        user_num: 待计算用户数量
    output:
        uInfo_list (creationDate +','+ reputation):包含用户信息的待计算用户列表
    '''
    for i in range(0, user_num):
        pipe.hgetall('userInfo:' + ulist[i])

    uInfo_list = pipe.execute()
    return uInfo_list

def get_matrix_with_sorted_set(ulist, user_num, key_pre_name, pipe):
    '''
    imput:
        ulist: 包含待计算用户的用户id的列表
        user_num: 待计算用户数量
    output:
        matrix: 所有待计算用户的对应信息列表
    '''
    for i in range(0, user_num):  # for each user
        userid = ulist[i]
        key = key_pre_name + ':' + userid
        pipe.zrange(key, 0, -1)

    matrix = pipe.execute()
    return matrix

def get_matrix_with_hash(ulist, user_num, key_pre_name, pipe):
    '''
    imput:
        ulist: 包含待计算用户的用户id的列表
        user_num: 待计算用户数量
    output:
        matrix: 所有待计算用户的对应信息列表
    '''
    for i in range(0, user_num):  # for each user
        userid = ulist[i]
        key = key_pre_name + ':' + userid
        pipe.hgetall(key)

    matrix = pipe.execute()
    return matrix

def timestampstr_2_datetime(tstampstr):
    '''将输入的时间戳字符串转化为日期返回'''
    new_time = datetime.fromtimestamp(int(tstampstr.split('.')[0]))
    return new_time

def load_userid(path):
    '''加载用户id
        imput: path, 文件路径
        output: userid(set),加载完的用户列表'''

    userids = list()
    with open(path, encoding = 'utf-8') as f:
        for line in f:
            uidstr = line.strip()
            userids.append(uidstr)
    return userids

def statis(alist):
    result = []

    # 处理缺失值
    if len(alist)==0:
        alist=[0]

    alist.sort()
    num = len(alist)
    result.append(alist[-1])
    result.append(alist[0])
    result.append(alist[int(num/4)])
    result.append(alist[int(num/2)])
    result.append(alist[int(num/4*3)])
    result.append(np.sum(alist))
    result.append(np.mean(alist))
    result.append(np.std(alist))
    result.append(np.var(alist))

    return result

def construct_path_output_sets(path_uid_sets, prefix):
    '''构造输出文件集合'''

    path_output_sets = []
    for i in range(0, len(path_uid_sets)):
        suffix = path_uid_sets[i].split('_')[-1]
        path_output =  data_path + r'\result' + '\\' + prefix + suffix
        path_output_sets.append(path_output)
    return path_output_sets

def add_ansnum_flag(num_path, output_path, reputation_threshold):
    putput_file = open(output_path, 'w', encoding='utf-8')

    with open(num_path, encoding='utf-8') as f:
        for line in f:
            feature_ansnum_split = [0, 0, 0, 0, 0, 0, 0, 0]
            ans_num = int(line.strip().split(',')[3])
            reputation = int(line.strip().split(',')[1])

            if ans_num<=5:
                feature_ansnum_split[0]=1
            else:
                feature_ansnum_split[1]=1
            if ans_num<=10:
                feature_ansnum_split[2]=1
            else:
                feature_ansnum_split[3]=1
            if ans_num<=15:
                feature_ansnum_split[4]=1
            else:
                feature_ansnum_split[5]=1
            if ans_num<=20:
                feature_ansnum_split[6]=1
            else:
                feature_ansnum_split[7]=1

            if reputation >= reputation_threshold:
                putput_file.write('1')
            else:
                putput_file.write('0')

            for j in range(0, 8):
                value = feature_ansnum_split[j]
                if(j<7):
                    if value>0:
                        putput_file.write(' '+str(j+1)+':'+str(value))
                else:
                    if(value>0):
                        putput_file.write(' '+str(j+1)+':'+str(value)+'\n')
                    else:
                        putput_file.write('\n')

def construct_protocol(items):
    num = len(items)
    protocol_string = '*' + str(num)

    for i in range(0, num):
        item = items[i]
        if not isinstance(item, str):
            item = str(item)

        protocol_string += '\n$' + str(len(item)) + '\n' + item

        if i==num-1:
            protocol_string += '\n'
    return protocol_string


if __name__ == '__main__':
    # path_featurePal = data_path + r'\result\feature_2012Pal1_d2_3m.txt'
    # path_featureDana = data_path + r'\result\feature_2013Dana1_3m_addtrans.txt'
    # path_featurePD = data_path + r'\result\feature_PD1_3m.txt'
    # path_featureRank = data_path + r'\result\feature_rank1_3m.txt'
    # path_featureTime = data_path + r'\result\feature_time1_3m.txt'
    # path_featureRT = data_path + r'\result\feature_timerank1_3m.txt'
    # path_featurePDRT = data_path + r'\result\feature_PDRT1_3m.txt'
    # path_featureQuss_fix2 = data_path + r'\result\feature_quss1_3m_fix2.txt'
    # path_featureTemp = data_path + r'\result\feature_temporal1_3m.txt'
    # path_featurePDRTT = data_path + r'\result\feature_PDRTT1_3m.txt'
    # path_featurePDRTTQ = data_path + r'\result\feature_PDRTTQ1_3m.txt'
    # path_featurePD_T = data_path + r'\result\feature_PD_T1_3m.txt'
    # path_featureA = data_path + r'\result\feature_ansnum_3m.txt'


    # path_fchange = path_featureA
    # path_ffix = path_featurePDRTTQ
    # path_output = data_path + r'\result\feature_PDRTTQA1_3m.txt'
    # path_ffix_feature_num = 94
    # conbine_feature(path_fchange, path_ffix, path_output, path_ffix_feature_num)

    # num_path = data_path + r'\temp\feature_2013Dana1_3m_add_adjust.txt'
    # path_output2 = data_path + r'\result\feature_ansnum_3m.txt'
    # reputation_threshold = 2400
    # add_ansnum_flag(num_path, path_output2, reputation_threshold)

    pass