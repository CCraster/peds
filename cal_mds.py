import json
import os
import time
import numpy as np
from sklearn import manifold

'''
    进行mds降维:二维
'''
def cal_mds(mdsPath, similarityPath):
    start = time.time()
    data_all = {}
    similarity_m = {}
    positions_info = {}
    # similarityPath = "./similarity_demo.json"
    if os.path.exists(similarityPath):
        with open(similarityPath, "r") as fs:
            data_all =json.load(fs)
    
    similarity_m = data_all["similarity_matrix"]
    positions_info["user_id"] = data_all["user_id"]

   # times = list(similarity_m.keys())
   # times.sort(key=lambda x:int(x))

    mds = manifold.MDS(n_components=2, max_iter=300,
                       dissimilarity="precomputed", n_jobs=1)

    print("开始MDS计算.........")
    sm = np.asarray(similarity_m)
        
    pos = mds.fit(sm).embedding_
    # print(pos)
    positions_info["positions"] = pos.tolist()
    # print(positions_info)
    end = time.time()
    print("结束MDS计算:", end-start)

    with open(mdsPath, 'w') as fs:
        json.dump(positions_info, fs)
    print("成功把降维结果写入：static/data/similarity_demo.json文件")
    return positions_info

cal_mds("static/data/result_demo.json", "static/data/similarity_demo.json")